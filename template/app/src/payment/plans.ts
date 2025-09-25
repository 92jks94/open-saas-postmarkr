import { requireNodeEnvVar } from '../server/utils';

export enum SubscriptionStatus {
  PastDue = 'past_due',
  CancelAtPeriodEnd = 'cancel_at_period_end',
  Active = 'active',
  Deleted = 'deleted',
}

export enum PaymentPlanId {
  SmallBatch = 'small_batch',
  MediumBatch = 'medium_batch',
  LargeBatch = 'large_batch',
}

export interface PaymentPlan {
  // Returns the id under which this payment plan is identified on your payment processor.
  // E.g. this might be price id on Stripe.
  getPaymentProcessorPlanId: () => string;
  effect: PaymentPlanEffect;
}

export type PaymentPlanEffect = { 
  kind: 'pages'; 
  minPages: number;
  maxPages: number;
  totalPrice: number;
  pricePerPage: number;
};

export const paymentPlans: Record<PaymentPlanId, PaymentPlan> = {
  [PaymentPlanId.SmallBatch]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_SMALL_BATCH_PLAN_ID'),
    effect: { 
      kind: 'pages', 
      minPages: 1,
      maxPages: 5,
      totalPrice: 2.50,
      pricePerPage: 0.50 // $2.50 / 5 pages = $0.50 per page
    },
  },
  [PaymentPlanId.MediumBatch]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_MEDIUM_BATCH_PLAN_ID'),
    effect: { 
      kind: 'pages', 
      minPages: 6,
      maxPages: 20,
      totalPrice: 7.50,
      pricePerPage: 0.375 // $7.50 / 20 pages = $0.375 per page
    },
  },
  [PaymentPlanId.LargeBatch]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_LARGE_BATCH_PLAN_ID'),
    effect: { 
      kind: 'pages', 
      minPages: 21,
      maxPages: 60,
      totalPrice: 15.00,
      pricePerPage: 0.25 // $15.00 / 60 pages = $0.25 per page
    },
  },
};

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const planToName: Record<PaymentPlanId, string> = {
    [PaymentPlanId.SmallBatch]: 'Small Batch (1-5 pages)',
    [PaymentPlanId.MediumBatch]: 'Medium Batch (6-20 pages)',
    [PaymentPlanId.LargeBatch]: 'Large Batch (21-60 pages)',
  };
  return planToName[planId];
}

export function parsePaymentPlanId(planId: string): PaymentPlanId {
  if ((Object.values(PaymentPlanId) as string[]).includes(planId)) {
    return planId as PaymentPlanId;
  } else {
    throw new Error(`Invalid PaymentPlanId: ${planId}`);
  }
}

export function getPageBasedPaymentPlanIds(): PaymentPlanId[] {
  return Object.values(PaymentPlanId).filter((planId) => paymentPlans[planId].effect.kind === 'pages');
}

// Helper function to get plan details for display
export function getPlanDetails(planId: PaymentPlanId) {
  const plan = paymentPlans[planId];
  if (plan.effect.kind === 'pages') {
    return {
      minPages: plan.effect.minPages,
      maxPages: plan.effect.maxPages,
      pageRange: `${plan.effect.minPages}-${plan.effect.maxPages} pages`,
      pricePerPage: plan.effect.pricePerPage,
      totalPrice: plan.effect.totalPrice,
      savings: planId === PaymentPlanId.LargeBatch ? 
        `Best value - only $${plan.effect.pricePerPage.toFixed(2)} per page` : 
        planId === PaymentPlanId.MediumBatch ? 
        `Good value - only $${plan.effect.pricePerPage.toFixed(3)} per page` : 
        `Standard rate - $${plan.effect.pricePerPage.toFixed(2)} per page`
    };
  }
  return null;
}
