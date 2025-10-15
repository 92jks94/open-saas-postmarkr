import { routes } from 'wasp/client/router';
import { SPACING } from '../constants';
import CTAButton from './CTAButton';

export default function FinalCTA() {
  return (
    <section className={`${SPACING.SECTION_PADDING_LG} relative overflow-hidden`}>
      {/* Gradient background */}
      <div className='absolute inset-0 bg-gradient-primary opacity-5 -z-10' />
      
      <div className={`container mx-auto ${SPACING.CONTAINER_PADDING}`}>
        <div className='max-w-4xl mx-auto text-center'>
          {/* Main Heading */}
          <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold ${SPACING.HEADING_MARGIN}`}>
            Ready to Send Your{' '}
            <span className='bg-gradient-primary bg-clip-text text-transparent'>First Letter?</span>
          </h2>
          
          {/* Description */}
          <p className={`text-lg md:text-xl text-muted-foreground ${SPACING.SUBHEADING_MARGIN} max-w-2xl mx-auto`}>
            Join thousands of businesses simplifying their mail operations. Get started in under 2 minutes.
          </p>
          
          {/* CTA Button */}
          <CTAButton href={routes.SignupRoute.to}>
            Start Sending Mail Now
          </CTAButton>
          
          {/* Reassurance text */}
          <p className='text-sm text-muted-foreground/80 mt-6'>
            No credit card required • Free to get started
          </p>
        </div>
      </div>
    </section>
  );
}

