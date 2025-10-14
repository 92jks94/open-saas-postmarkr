import { ArrowRight } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';

export default function Hero() {
  return (
    <section className='relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden'>
      {/* Gradient Background */}
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      {/* Animated gradient orbs */}
      <div className='absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float' />
      <div
        className='absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float'
        style={{ animationDelay: '3s' }}
      />

      <div className='container mx-auto px-4 md:px-6 lg:px-8 py-20 relative z-10'>
        <div className='max-w-5xl mx-auto text-center animate-fade-in-up'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 mb-8'>
            <span className='w-2 h-2 bg-primary rounded-full animate-pulse' />
            <span className='text-sm font-medium text-primary'>Processing 1,000+ pieces of mail daily</span>
          </div>

          {/* Main Headline with Gradient */}
          <h1 id='hero-heading' className='text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight'>
            <span className='bg-gradient-primary bg-clip-text text-transparent'>Leave the Print Shop</span>
            <br />
            & Post Office
            <br />
            to Us
          </h1>

          {/* Subheadline */}
          <p className='text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto'>
            We print, we stuff, we send, we track—you focus on what matters
          </p>

          {/* Sub-subheadline */}
          <p className='text-lg text-muted-foreground/80 mb-12 max-w-2xl mx-auto'>
            No equipment to buy, no supplies to manage, no trips to the post office. From upload to mailbox in days.
          </p>

          {/* CTA Buttons */}
          <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center'>
            <Button
              size='lg'
              className='text-base md:text-lg px-8 py-6 shadow-glow hover:shadow-glow hover:scale-105 transition-all bg-gradient-primary border-0'
              asChild
            >
              <WaspRouterLink to={routes.SignupRoute.to} className='inline-flex items-center'>
                Start Sending Mail
                <ArrowRight className='ml-2 h-5 w-5' />
              </WaspRouterLink>
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='text-base md:text-lg px-8 py-6 hover:bg-primary/5 hover:scale-105 transition-all border-primary/20'
              asChild
            >
              <a href='#pricing'>View Pricing</a>
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className='flex flex-wrap justify-center items-center gap-4 md:gap-8 mt-12 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <svg className='w-4 h-4 text-success' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <span>No Setup Fees</span>
            </div>
            <div className='flex items-center gap-2'>
              <svg className='w-4 h-4 text-success' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
              </svg>
              <span>Cancel Anytime</span>
            </div>
            <div className='flex items-center gap-2'>
              <svg className='w-4 h-4 text-success' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' />
              </svg>
              <span>Bank-Level Security</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
