import { Check, X } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { SPACING, CARD_STYLES } from '../constants';
import SectionHeader from './SectionHeader';
import IconContainer from './IconContainer';

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
    <section className={`${SPACING.SECTION_PADDING_LG} relative overflow-hidden`}>
      <div className='absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background -z-10' />

      <div className={`container mx-auto ${SPACING.CONTAINER_PADDING}`}>
        <SectionHeader
          id="what-we-handle-heading"
          title="What We"
          highlightedText="Handle"
          subtitle="Your complete mail room solution, accessible from anywhere"
        />

        <div className={`grid md:grid-cols-2 ${SPACING.GRID_GAP_LG} max-w-5xl mx-auto`}>
          {/* What We Do */}
          <Card className={CARD_STYLES.WITH_ANIMATION}>
            <div className='flex items-center gap-3 mb-6'>
              <IconContainer icon={Check} variant="primary" />
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
          <Card className={`${CARD_STYLES.WITH_ANIMATION}`} style={{ animationDelay: '0.2s' }}>
            <div className='flex items-center gap-3 mb-6'>
              <IconContainer icon={X} variant="muted" />
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

