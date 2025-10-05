import { Check } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';

const plans = [
  {
    name: 'Basic',
    price: '$2.50',
    pages: '1-5 pages',
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
    price: '$7.50',
    pages: '6-20 pages',
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
    price: '$15.00',
    pages: '21-60 pages',
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
    <section className='py-24 relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      {/* Decorative gradient orbs */}
      <div className='absolute top-1/2 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-y-1/2' />
      <div className='absolute top-1/2 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2' />

      <div className='container mx-auto px-4 relative z-10'>
        <div className='text-center mb-16 animate-fade-in-up'>
          <h2 id='pricing-heading' className='text-4xl md:text-5xl font-bold mb-4'>
            Simple, <span className='bg-gradient-primary bg-clip-text text-transparent'>transparent pricing</span>
          </h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Pay only for what you send. No subscriptions, no hidden fees.
          </p>
        </div>

        <div className='grid md:grid-cols-3 gap-8 max-w-6xl mx-auto'>
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative p-8 bg-card/70 backdrop-blur transition-all duration-300 hover:shadow-glass hover:-translate-y-2 animate-fade-in-up ${
                plan.popular ? 'border-primary shadow-glow scale-105 md:scale-110' : 'border-border'
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
              <div className='text-center mb-8'>
                <h3 className='text-2xl font-bold mb-2'>{plan.name}</h3>
                <div className='mb-2'>
                  <span className='text-5xl font-bold bg-gradient-primary bg-clip-text text-transparent'>
                    {plan.price}
                  </span>
                </div>
                <p className='text-sm text-muted-foreground font-medium'>{plan.pages}</p>
                <p className='text-sm text-muted-foreground mt-2'>{plan.description}</p>
              </div>

              {/* Features List */}
              <ul className='space-y-4 mb-8'>
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
        <p
          className='text-center text-muted-foreground mt-12 animate-fade-in-up'
          style={{ animationDelay: '0.4s' }}
        >
          All plans include free address validation and secure payment processing
        </p>
      </div>
    </section>
  );
}

