import { ArrowRight } from 'lucide-react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';

export default function Hero() {
  return (
    <section className='relative min-h-screen flex items-center justify-center overflow-hidden'>
      {/* Gradient Background */}
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      {/* Animated gradient orbs */}
      <div className='absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float' />
      <div
        className='absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float'
        style={{ animationDelay: '3s' }}
      />

      <div className='container mx-auto px-4 py-20 relative z-10'>
        <div className='max-w-5xl mx-auto text-center animate-fade-in-up'>
          {/* Badge */}
          <div className='inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8'>
            <span className='w-2 h-2 bg-primary rounded-full animate-pulse' />
            <span className='text-sm font-medium text-primary'>Trusted by 10,000+ users worldwide</span>
          </div>

          {/* Main Headline with Gradient */}
          <h1 id='hero-heading' className='text-5xl md:text-7xl font-bold mb-6 leading-tight'>
            <span className='bg-gradient-primary bg-clip-text text-transparent'>Send physical mail</span>
            <br />
            from anywhere without
            <br />
            post office visits
          </h1>

          {/* Subheadline */}
          <p className='text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto'>
            Perfect for remote workers, freelancers, and digital nomads who need reliable mail services
          </p>

          {/* CTA Buttons */}
          <div className='flex flex-col sm:flex-row gap-4 justify-center items-center'>
            <Button
              size='lg'
              className='text-lg px-8 py-6 shadow-glow hover:shadow-glow hover:scale-105 transition-all bg-gradient-primary border-0'
              asChild
            >
              <a href='#pricing' className='inline-flex items-center'>
                View Pricing
                <ArrowRight className='ml-2 h-5 w-5' />
              </a>
            </Button>
            <Button
              size='lg'
              variant='outline'
              className='text-lg px-8 py-6 hover:bg-primary/5 hover:scale-105 transition-all'
              asChild
            >
              <WaspRouterLink to={routes.SignupRoute.to}>Start Sending Mail</WaspRouterLink>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
