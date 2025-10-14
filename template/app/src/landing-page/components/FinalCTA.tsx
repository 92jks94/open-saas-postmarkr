import { ArrowRight } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';

export default function FinalCTA() {
  return (
    <section className='py-20 md:py-24 relative overflow-hidden'>
      {/* Gradient background */}
      <div className='absolute inset-0 bg-gradient-primary opacity-5 -z-10' />
      
      <div className='container mx-auto px-4 md:px-6 lg:px-8'>
        <div className='max-w-4xl mx-auto text-center'>
          {/* Main Heading */}
          <h2 className='text-3xl md:text-4xl lg:text-5xl font-bold mb-6'>
            Ready to Send Your{' '}
            <span className='bg-gradient-primary bg-clip-text text-transparent'>First Letter?</span>
          </h2>
          
          {/* Description */}
          <p className='text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto'>
            Join thousands of businesses simplifying their mail operations. Get started in under 2 minutes.
          </p>
          
          {/* CTA Button */}
          <Button
            size='lg'
            className='text-base md:text-lg px-8 py-6 shadow-glow hover:shadow-glow hover:scale-105 transition-all bg-gradient-primary border-0'
            asChild
          >
            <WaspRouterLink to={routes.SignupRoute.to} className='inline-flex items-center'>
              Start Sending Mail Now
              <ArrowRight className='ml-2 h-5 w-5' />
            </WaspRouterLink>
          </Button>
          
          {/* Reassurance text */}
          <p className='text-sm text-muted-foreground/80 mt-6'>
            No credit card required • Free to get started
          </p>
        </div>
      </div>
    </section>
  );
}

