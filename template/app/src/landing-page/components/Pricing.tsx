import { Check } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { PRICING_TIERS } from '../../shared/constants/pricing';
import { SPACING } from '../constants';
import SectionHeader from './SectionHeader';

// Build plans from centralized pricing constants
const plans = [
  {
    name: 'Basic',
    price: `$${PRICING_TIERS[0].priceInDollars.toFixed(2)}`,
    pages: `${PRICING_TIERS[0].minPages}-${PRICING_TIERS[0].maxPages} pages`,
    description: 'Perfect for simple letters and documents',
    features: [
      'First Class Mail delivery',
      'Basic tracking',
      'Address validation',
      'Email notifications',
      'Standard processing',
    ],
    popular: false,
  },
  {
    name: 'Standard',
    price: `$${PRICING_TIERS[1].priceInDollars.toFixed(2)}`,
    pages: `${PRICING_TIERS[1].minPages}-${PRICING_TIERS[1].maxPages} pages`,
    description: 'Ideal for contracts and reports',
    features: [
      'Priority Mail delivery',
      'Advanced tracking',
      'Address validation',
      'SMS & email notifications',
      'Priority processing',
      'Certified mail option',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    price: `$${PRICING_TIERS[2].priceInDollars.toFixed(2)}`,
    pages: `${PRICING_TIERS[2].minPages}-${PRICING_TIERS[2].maxPages} pages`,
    description: 'For comprehensive documents',
    features: [
      'Express Mail delivery',
      'Real-time tracking',
      'Address validation',
      'SMS, email & push notifications',
      'Express processing',
      'Certified mail included',
      'Dedicated support',
    ],
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section className={`${SPACING.SECTION_PADDING_LG} relative overflow-hidden`}>
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      {/* Decorative gradient orbs */}
      <div className='absolute top-1/2 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2' />
      <div className='absolute top-1/2 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2' />

      <div className={`container mx-auto ${SPACING.CONTAINER_PADDING} relative z-10`}>
        <SectionHeader
          id="pricing-heading"
          title="Simple,"
          highlightedText="transparent pricing"
          subtitle="Pay only for what you send. No subscriptions, no hidden fees."
        />

        <div className={`grid md:grid-cols-3 ${SPACING.GRID_GAP_LG} max-w-6xl mx-auto`}>
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative p-6 md:p-8 bg-card/70 backdrop-blur transition-all duration-300 hover:shadow-glass hover:-translate-y-1 animate-fade-in-up ${
                plan.popular ? 'border-primary shadow-glow md:scale-105' : 'border-border'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className='absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-primary text-primary-foreground text-sm font-semibold rounded-full shadow-lg'>
                  Most Popular
                </div>
              )}

              {/* Plan Header */}
              <div className={`text-center ${SPACING.SUBHEADING_MARGIN}`}>
                <h3 className='text-2xl font-bold mb-2'>{plan.name}</h3>
                <div className='mb-1'>
                  <span className='text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent'>
                    {plan.price}
                  </span>
                </div>
                <p className='text-xs text-muted-foreground/80 mb-2'>per piece</p>
                <p className='text-sm text-muted-foreground font-medium'>{plan.pages}</p>
                <p className='text-sm text-muted-foreground mt-2'>{plan.description}</p>
              </div>

              {/* Features List */}
              <ul className={`space-y-3 ${SPACING.SUBHEADING_MARGIN}`}>
                {plan.features.map((feature) => (
                  <li key={feature} className='flex items-start gap-3'>
                    <div className='w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5'>
                      <Check className='w-3 h-3 text-primary' />
                    </div>
                    <span className='text-sm'>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Button
                className={`w-full ${
                  plan.popular
                    ? 'bg-gradient-primary shadow-glow hover:shadow-glow hover:scale-105'
                    : 'hover:bg-primary/10'
                }`}
                variant={plan.popular ? 'default' : 'outline'}
                asChild
              >
                <WaspRouterLink to={routes.SignupRoute.to}>Get Started</WaspRouterLink>
              </Button>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className='mt-12 max-w-3xl mx-auto animate-fade-in-up' style={{ animationDelay: '0.4s' }}>
          <p className='text-center text-muted-foreground mb-6'>
            All plans include free address validation and secure payment processing
          </p>
          
          {/* Pricing Details Card */}
          <Card className='bg-primary/5 border-primary/20 p-6'>
            <h4 className='text-sm font-semibold mb-4 text-center'>What's Included in Every Price</h4>
            <div className='grid sm:grid-cols-2 gap-4 text-sm text-muted-foreground'>
              <div className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-primary flex-shrink-0 mt-0.5' />
                <div>
                  <span className='font-medium text-foreground'>Professional Printing:</span> High-quality color or B&W printing on premium paper
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-primary flex-shrink-0 mt-0.5' />
                <div>
                  <span className='font-medium text-foreground'>USPS Postage:</span> All postage costs included in the price
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-primary flex-shrink-0 mt-0.5' />
                <div>
                  <span className='font-medium text-foreground'>Envelope & Stuffing:</span> Professional envelope with addressing and sealing
                </div>
              </div>
              <div className='flex items-start gap-2'>
                <Check className='w-4 h-4 text-primary flex-shrink-0 mt-0.5' />
                <div>
                  <span className='font-medium text-foreground'>Delivery Tracking:</span> USPS tracking number for every piece
                </div>
              </div>
            </div>
            <p className='text-xs text-muted-foreground/80 mt-4 text-center'>
              Pages are counted as single-sided letter-size (8.5" × 11"). No hidden fees or surprise charges.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}

