import { type MiddlewareConfigFn, HttpError } from 'wasp/server';
import { type PaymentsWebhook } from 'wasp/server/api';
import { type PrismaClient } from '@prisma/client';
import express from 'express';
import type { Stripe } from 'stripe';
import { stripe } from './stripeClient';
import { paymentPlans, PaymentPlanId, SubscriptionStatus, type PaymentPlanEffect } from '../plans';
import { updateUserStripePaymentDetails } from './paymentDetails';
import { emailSender } from 'wasp/server/email';
import { submitPaidMailToLob } from 'wasp/server/jobs';
import { assertUnreachable } from '../../shared/utils';
import { requireNodeEnvVar } from '../../server/utils';
import {
  parseWebhookPayload,
  type InvoicePaidData,
  type SessionCompletedData,
  type SubscriptionDeletedData,
  type SubscriptionUpdatedData,
  type PaymentIntentSucceededData,
  type PaymentIntentFailedData,
} from './webhookPayload';
import { UnhandledWebhookEventError } from '../errors';
import { sendPaymentConfirmationEmail, fetchMailPieceForEmail, sendPaymentFailedEmail } from '../../server/email/mailNotifications';

export const stripeWebhook: PaymentsWebhook = async (request, response, context) => {
  try {
    console.log('🔔 Stripe webhook received:', {
      timestamp: new Date().toISOString(),
      headers: {
        'stripe-signature': request.headers['stripe-signature'] ? 'present' : 'missing',
        'content-type': request.headers['content-type']
      }
    });
    
    const rawStripeEvent = constructStripeEvent(request);
    const { eventName, data } = await parseWebhookPayload(rawStripeEvent);
    
    console.log('📋 Processing webhook event:', {
      eventType: rawStripeEvent.type,
      eventId: rawStripeEvent.id,
      parsedEventName: eventName
    });
    
    const prismaUserDelegate = context.entities.User;
    switch (eventName) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(data, prismaUserDelegate, context);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(data, prismaUserDelegate);
        break;
      case 'customer.subscription.updated':
        await handleCustomerSubscriptionUpdated(data, prismaUserDelegate);
        break;
      case 'customer.subscription.deleted':
        await handleCustomerSubscriptionDeleted(data, prismaUserDelegate);
        break;
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(data, context);
        break;
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(data, context);
        break;
      default:
        // If you'd like to handle more events, you can add more cases above.
        // When deploying your app, you configure your webhook in the Stripe dashboard to only send the events that you're
        // handling above and that are necessary for the functioning of your app. See: https://docs.opensaas.sh/guides/deploying/#setting-up-your-stripe-webhook
        // In development, it is likely that you will receive other events that you are not handling, and that's fine. These can be ignored without any issues.
        assertUnreachable(eventName);
    }
    return response.json({ received: true }); // Stripe expects a 200 response to acknowledge receipt of the webhook
  } catch (err) {
    if (err instanceof UnhandledWebhookEventError) {
      console.error(err.message);
      return response.status(422).json({ error: err.message });
    }

    console.error('Webhook error:', err);
    if (err instanceof HttpError) {
      return response.status(err.statusCode).json({ error: err.message });
    } else {
      return response.status(400).json({ error: 'Error processing Stripe webhook event' });
    }
  }
};

function constructStripeEvent(request: express.Request): Stripe.Event {
  try {
    const secret = requireNodeEnvVar('STRIPE_WEBHOOK_SECRET');
    const sig = request.headers['stripe-signature'];
    if (!sig) {
      throw new HttpError(400, 'Stripe webhook signature not provided');
    }
    return stripe.webhooks.constructEvent(request.body, sig, secret);
  } catch (err) {
    throw new HttpError(500, 'Error constructing Stripe webhook event');
  }
}

export const stripeMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  // We need to delete the default 'express.json' middleware and replace it with 'express.raw' middleware
  // because webhook data in the body of the request as raw JSON, not as JSON in the body of the request.
  middlewareConfig.delete('express.json');
  middlewareConfig.set('express.raw', express.raw({ type: 'application/json' }));
  return middlewareConfig;
};

// Here we only update the user's payment details, and confirm credits because Stripe does not send invoices for one-time payments.
// NOTE: If you're accepting async payment methods like bank transfers or SEPA and not just card payments
// which are synchronous, checkout session completed could potentially result in a pending payment.
// If so, use the checkout.session.async_payment_succeeded event to confirm the payment.
async function handleCheckoutSessionCompleted(
  session: SessionCompletedData,
  prismaUserDelegate: PrismaClient['user'],
  context: any
) {
  console.log('🛒 Processing checkout session completed:', {
    sessionId: session.id,
    mode: session.mode,
    paymentStatus: session.payment_status,
    metadata: session.metadata
  });
  
  const isSuccessfulOneTimePayment = session.mode === 'payment' && session.payment_status === 'paid';
  console.log('💰 Payment check:', {
    isSuccessfulOneTimePayment,
    mode: session.mode,
    paymentStatus: session.payment_status
  });
  
  if (isSuccessfulOneTimePayment) {
    console.log('✅ Successful one-time payment detected');
    // Check if this is a mail payment
    if (session.metadata?.type === 'mail_payment' && session.metadata?.mailPieceId) {
      console.log('📬 Mail payment detected, calling handleMailPaymentCompleted');
      await handleMailPaymentCompleted(session, context);
    } else {
      console.log('💳 Regular payment detected, calling saveSuccessfulOneTimePayment');
      // Handle regular subscription/credit payments
      await saveSuccessfulOneTimePayment(session, prismaUserDelegate);
    }
  } else {
    console.log('❌ Not a successful one-time payment:', {
      mode: session.mode,
      paymentStatus: session.payment_status
    });
  }
}

async function handleMailPaymentCompleted(session: SessionCompletedData, context: any) {
  try {
    console.log('💳 Processing mail payment completion:', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      mode: session.mode,
      metadata: session.metadata
    });
    
    const mailPieceId = session.metadata?.mailPieceId;
    if (!mailPieceId) {
      console.error('❌ Mail payment completed but no mailPieceId in metadata');
      return;
    }

    console.log(`📬 Processing mail payment completion for mail piece: ${mailPieceId}`);

    // Update mail piece status directly in the webhook
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: mailPieceId }
    });

    if (!mailPiece) {
      console.error(`Mail piece not found: ${mailPieceId}`);
      return;
    }

    // Check if already processed to prevent duplicate processing
    if (mailPiece.paymentStatus === 'paid' && mailPiece.status === 'paid') {
      console.log(`ℹ️ Mail piece ${mailPieceId} already processed, skipping`);
      return;
    }

    // Check if already submitted to Lob
    if (mailPiece.lobId) {
      console.log(`ℹ️ Mail piece ${mailPieceId} already submitted to Lob (ID: ${mailPiece.lobId}), skipping`);
      return;
    }

    // Update mail piece to paid status using conditional update to prevent race conditions
    const updateResult = await context.entities.MailPiece.updateMany({
      where: { 
        id: mailPieceId,
        paymentStatus: 'pending', // Only update if still pending
        status: 'pending_payment', // Only update if still pending
        lobId: null // Only update if not already submitted to Lob
      },
      data: {
        paymentStatus: 'paid',
        status: 'paid',
        paymentIntentId: session.id,
      },
    });

    // Check if the update succeeded (count will be 0 if already processed)
    if (updateResult.count === 0) {
      console.log(`ℹ️ Mail piece ${mailPieceId} was already processed by another process, skipping`);
      return;
    }

    console.log('✅ Updated mail piece status:', {
      mailPieceId,
      oldStatus: mailPiece.status,
      newStatus: 'paid',
      paymentStatus: 'paid'
    });

    // Create status history entry
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: mailPieceId,
        status: 'paid',
        previousStatus: mailPiece.status,
        description: 'Payment completed via Stripe Checkout',
        source: 'webhook',
      },
    });

    console.log(`✅ Mail payment completed successfully for mail piece ${mailPieceId}`);

    // Send payment confirmation email
    try {
      const mailPieceForEmail = await fetchMailPieceForEmail(mailPieceId, context);
      if (mailPieceForEmail) {
        await sendPaymentConfirmationEmail(mailPieceForEmail);
      }
    } catch (emailError) {
      console.error(`❌ Error sending payment confirmation email for ${mailPieceId}:`, emailError);
      // Don't fail the webhook - payment is confirmed
    }

    // Schedule background job to submit to Lob after payment confirmation
    try {
      console.log(`📋 Scheduling Lob submission job for mail piece ${mailPieceId}...`);
      
      // Schedule job for immediate execution with retries
      await submitPaidMailToLob.submit(
        { mailPieceId },
        { 
          retryLimit: 3,           // Retry up to 3 times if it fails
          retryDelay: 60,          // Wait 60 seconds between retries
          retryBackoff: true       // Use exponential backoff
        }
      );
      
      console.log(`✅ Lob submission job scheduled for mail piece ${mailPieceId}`);
    } catch (jobError) {
      console.error(`❌ Error scheduling Lob submission job for ${mailPieceId}:`, jobError);
      // Don't fail the webhook - payment is confirmed
      // Job system will handle retries
    }
    
  } catch (error) {
    console.error('❌ Failed to handle mail payment completion:', error);
  }
}

async function saveSuccessfulOneTimePayment(
  session: SessionCompletedData,
  prismaUserDelegate: PrismaClient['user']
) {
  const userStripeId = session.customer;
  const lineItems = await getCheckoutLineItemsBySessionId(session.id);
  const lineItemPriceId = extractPriceId(lineItems);
  const planId = getPlanIdByPriceId(lineItemPriceId);
  const plan = paymentPlans[planId];
  const { numOfCreditsPurchased } = getPlanEffectPaymentDetails({ planId, planEffect: plan.effect });
  return updateUserStripePaymentDetails(
    { userStripeId, numOfCreditsPurchased, datePaid: new Date() },
    prismaUserDelegate
  );
}

// This is called when a subscription is successfully purchased or renewed and payment succeeds.
// Invoices are not created for one-time payments, so we handle them above.
async function handleInvoicePaid(invoice: InvoicePaidData, prismaUserDelegate: PrismaClient['user']) {
  await saveActiveSubscription(invoice, prismaUserDelegate);
}

async function saveActiveSubscription(invoice: InvoicePaidData, prismaUserDelegate: PrismaClient['user']) {
  const userStripeId = invoice.customer;
  const datePaid = new Date(invoice.period_start * 1000);
  const priceId = extractPriceId(invoice.lines);
  const subscriptionPlan = getPlanIdByPriceId(priceId);
  return updateUserStripePaymentDetails(
    { userStripeId, datePaid, subscriptionPlan, subscriptionStatus: SubscriptionStatus.Active },
    prismaUserDelegate
  );
}

async function handleCustomerSubscriptionUpdated(
  subscription: SubscriptionUpdatedData,
  prismaUserDelegate: PrismaClient['user']
) {
  const userStripeId = subscription.customer;
  let subscriptionStatus: SubscriptionStatus | undefined;
  const priceId = extractPriceId(subscription.items);
  const subscriptionPlan = getPlanIdByPriceId(priceId);

  // There are other subscription statuses, such as `trialing` that we are not handling and simply ignore
  // If you'd like to handle more statuses, you can add more cases above. Make sure to update the `SubscriptionStatus` type in `payment/plans.ts` as well.
  if (subscription.status === SubscriptionStatus.Active) {
    subscriptionStatus = subscription.cancel_at_period_end
      ? SubscriptionStatus.CancelAtPeriodEnd
      : SubscriptionStatus.Active;
  } else if (subscription.status === SubscriptionStatus.PastDue) {
    subscriptionStatus = SubscriptionStatus.PastDue;
  }
  if (subscriptionStatus) {
    const user = await updateUserStripePaymentDetails(
      { userStripeId, subscriptionPlan, subscriptionStatus },
      prismaUserDelegate
    );
    if (subscription.cancel_at_period_end) {
      if (user.email) {
        await emailSender.send({
          to: user.email,
          subject: 'We hate to see you go :(',
          text: 'We hate to see you go. Here is a sweet offer...',
          html: 'We hate to see you go. Here is a sweet offer...',
        });
      }
    }
    return user;
  }
}

async function handleCustomerSubscriptionDeleted(
  subscription: SubscriptionDeletedData,
  prismaUserDelegate: PrismaClient['user']
) {
  const userStripeId = subscription.customer;
  return updateUserStripePaymentDetails(
    { userStripeId, subscriptionStatus: SubscriptionStatus.Deleted },
    prismaUserDelegate
  );
}

// We only expect one line item, but if you set up a product with multiple prices, you should change this function to handle them.
function extractPriceId(
  items: Stripe.ApiList<Stripe.LineItem> | SubscriptionUpdatedData['items'] | InvoicePaidData['lines']
): string {
  if (items.data.length === 0) {
    throw new HttpError(400, 'No items in stripe event object');
  }
  if (items.data.length > 1) {
    throw new HttpError(400, 'More than one item in stripe event object');
  }
  const item = items.data[0];

  // The 'price' property is found on SubscriptionItem and LineItem.
  if ('price' in item && item.price?.id) {
    return item.price.id;
  }

  // The 'pricing' property is found on InvoiceLineItem.
  if ('pricing' in item) {
    const priceId = item.pricing?.price_details?.price;
    if (priceId) {
      return priceId;
    }
  }
  throw new HttpError(400, 'Unable to extract price id from item');
}

async function getCheckoutLineItemsBySessionId(sessionId: string) {
  const { line_items } = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['line_items'],
  });
  if (!line_items) {
    throw new HttpError(400, 'No line items found in checkout session');
  }
  return line_items;
}

function getPlanIdByPriceId(priceId: string): PaymentPlanId {
  const planId = Object.values(PaymentPlanId).find(
    (planId) => paymentPlans[planId].getPaymentProcessorPlanId() === priceId
  );
  if (!planId) {
    throw new Error(`No plan with Stripe price id ${priceId}`);
  }
  return planId;
}

function getPlanEffectPaymentDetails({
  planId,
  planEffect,
}: {
  planId: PaymentPlanId;
  planEffect: PaymentPlanEffect;
}): {
  subscriptionPlan: PaymentPlanId | undefined;
  numOfCreditsPurchased: number | undefined;
} {
  switch (planEffect.kind) {
    case 'pages':
      return { subscriptionPlan: undefined, numOfCreditsPurchased: undefined };
  }
}

// Handle successful mail payment intents
async function handlePaymentIntentSucceeded(
  paymentIntent: PaymentIntentSucceededData,
  context: any
) {
  console.log('💳 Processing payment intent succeeded:', {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    currency: paymentIntent.currency,
    metadata: paymentIntent.metadata
  });
  
  // Check if this is a mail payment based on metadata
  if (paymentIntent.metadata?.type === 'mail_payment') {
    const mailPieceId = paymentIntent.metadata.mailPieceId;
    if (mailPieceId) {
      console.log(`📬 Processing payment intent for mail piece: ${mailPieceId}`);
      
      // Update mail piece status to paid
      const updatedMailPiece = await context.entities.MailPiece.update({
        where: { paymentIntentId: paymentIntent.id },
        data: {
          paymentStatus: 'paid',
          status: 'paid',
        },
      });

      console.log('✅ Updated mail piece via payment intent:', {
        mailPieceId,
        paymentIntentId: paymentIntent.id,
        newStatus: 'paid'
      });

      // Create status history entry
      await context.entities.MailPieceStatusHistory.create({
        data: {
          mailPieceId: mailPieceId,
          status: 'paid',
          previousStatus: 'pending_payment',
          description: 'Payment confirmed via webhook',
          source: 'webhook',
        },
      });

      console.log(`✅ Mail payment succeeded for payment intent ${paymentIntent.id}`);
    } else {
      console.log('⚠️ Payment intent has mail_payment type but no mailPieceId in metadata');
    }
  } else {
    console.log('ℹ️ Payment intent is not a mail payment, skipping mail processing');
  }
}

// Handle failed mail payment intents
async function handlePaymentIntentFailed(
  paymentIntent: PaymentIntentFailedData,
  context: any
) {
  // Check if this is a mail payment based on metadata
  if (paymentIntent.metadata?.type === 'mail_payment') {
    const mailPieceId = paymentIntent.metadata.mailPieceId;
    if (mailPieceId) {
      // Fetch mail piece with user info for email
      const mailPieceForEmail = await fetchMailPieceForEmail(mailPieceId, context);
      
      // Update mail piece status to failed
      await context.entities.MailPiece.update({
        where: { paymentIntentId: paymentIntent.id },
        data: {
          paymentStatus: 'failed',
          status: 'failed',
        },
      });

      // Create status history entry
      await context.entities.MailPieceStatusHistory.create({
        data: {
          mailPieceId: mailPieceId,
          status: 'failed',
          previousStatus: 'pending_payment',
          description: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
          source: 'webhook',
        },
      });

      console.log(`Mail payment failed for payment intent ${paymentIntent.id}`);
      
      // Send payment failed email
      if (mailPieceForEmail) {
        try {
          const userEmail = mailPieceForEmail.user.email;
          const userName = mailPieceForEmail.user.username || userEmail?.split('@')[0] || 'Valued Customer';
          
          if (userEmail) {
            const failureMessage = paymentIntent.last_payment_error?.message || 'Your payment could not be processed';
            await sendPaymentFailedEmail(
              userEmail,
              userName,
              mailPieceForEmail.mailType,
              mailPieceForEmail.cost || 0,
              failureMessage
            );
          }
        } catch (emailError) {
          console.error(`❌ Error sending payment failed email for ${mailPieceId}:`, emailError);
        }
      }
    }
  }
}
