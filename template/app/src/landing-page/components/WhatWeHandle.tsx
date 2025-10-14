import { Check, X } from 'lucide-react';
import { Card } from '../../components/ui/card';

const whatWeDoItems = [
  'Professional printing (color & B&W)',
  'Envelope stuffing & addressing',
  'Postage (First Class, Certified, Priority, Express)',
  'USPS submission & tracking',
  'Delivery confirmation',
];

const whatYouDontNeedItems = [
  'No printers needed',
  'No envelopes to buy',
  'No postage machines',
  'No post office visits',
];

export default function WhatWeHandle() {
  return (
    <section className='py-24 relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background -z-10' />

      <div className='container mx-auto px-4'>
        <div className='text-center mb-16 animate-fade-in-up'>
          <h2 id='what-we-handle-heading' className='text-4xl md:text-5xl font-bold mb-4'>
            What We <span className='bg-gradient-primary bg-clip-text text-transparent'>Handle</span>
          </h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Your complete mail room solution, accessible from anywhere
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-8 max-w-5xl mx-auto'>
          {/* What We Do */}
          <Card className='p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass animate-fade-in-up'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow'>
                <Check className='w-6 h-6 text-primary-foreground' />
              </div>
              <h3 className='text-2xl font-semibold'>What We Do</h3>
            </div>
            <ul className='space-y-4'>
              {whatWeDoItems.map((item, index) => (
                <li
                  key={index}
                  className='flex items-start gap-3 animate-fade-in-up'
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <Check className='w-5 h-5 text-primary mt-0.5 flex-shrink-0' />
                  <span className='text-muted-foreground'>{item}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* What You Don't Need */}
          <Card className='p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass animate-fade-in-up' style={{ animationDelay: '0.2s' }}>
            <div className='flex items-center gap-3 mb-6'>
              <div className='w-12 h-12 rounded-xl bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center'>
                <X className='w-6 h-6 text-muted-foreground' />
              </div>
              <h3 className='text-2xl font-semibold'>What You Don't Need</h3>
            </div>
            <ul className='space-y-4'>
              {whatYouDontNeedItems.map((item, index) => (
                <li
                  key={index}
                  className='flex items-start gap-3 animate-fade-in-up'
                  style={{ animationDelay: `${(index + 5) * 0.1}s` }}
                >
                  <X className='w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0' />
                  <span className='text-muted-foreground'>{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </section>
  );
}

