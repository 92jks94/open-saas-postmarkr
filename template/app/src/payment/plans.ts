import { requireNodeEnvVar } from '../server/utils';
import { PRICING_TIERS } from '../shared/constants/pricing';

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

// Build payment plans from centralized pricing constants
const tier1 = PRICING_TIERS[0];
const tier2 = PRICING_TIERS[1];
const tier3 = PRICING_TIERS[2];

export const paymentPlans: Record<PaymentPlanId, PaymentPlan> = {
  [PaymentPlanId.SmallBatch]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_SMALL_BATCH_PLAN_ID'),
    effect: { 
      kind: 'pages', 
      minPages: tier1.minPages,
      maxPages: tier1.maxPages,
      totalPrice: tier1.priceInDollars,
      pricePerPage: tier1.priceInDollars / tier1.maxPages
    },
  },
  [PaymentPlanId.MediumBatch]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_MEDIUM_BATCH_PLAN_ID'),
    effect: { 
      kind: 'pages', 
      minPages: tier2.minPages,
      maxPages: tier2.maxPages,
      totalPrice: tier2.priceInDollars,
      pricePerPage: tier2.priceInDollars / tier2.maxPages
    },
  },
  [PaymentPlanId.LargeBatch]: {
    getPaymentProcessorPlanId: () => requireNodeEnvVar('PAYMENTS_LARGE_BATCH_PLAN_ID'),
    effect: { 
      kind: 'pages', 
      minPages: tier3.minPages,
      maxPages: tier3.maxPages,
      totalPrice: tier3.priceInDollars,
      pricePerPage: tier3.priceInDollars / tier3.maxPages
    },
  },
};

export function prettyPaymentPlanName(planId: PaymentPlanId): string {
  const plan = paymentPlans[planId];
  if (plan.effect.kind === 'pages') {
    return `${planId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} (${plan.effect.minPages}-${plan.effect.maxPages} pages)`;
  }
  return planId;
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
