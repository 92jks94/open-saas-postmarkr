import { routes } from 'wasp/client/router';
import { useQuery, getMailPieces } from 'wasp/client/operations';
import type { AuthUser } from 'wasp/auth';
import { Button } from '../../components/ui/button';
import { SPACING } from '../constants';
import CTAButton from './CTAButton';

export default function Hero({ user }: { user: AuthUser | null | undefined }) {
  // Get user's mail count for personalization
  const { data: mailData } = useQuery(getMailPieces, 
    { page: 1, limit: 1 }, 
    { enabled: !!user } // Only fetch if user is signed in
  );

  const userMailCount = mailData?.total || 0;
  const isReturningUser = !!user;

  // Personalized content
  const badge = isReturningUser && userMailCount > 0
    ? `You've sent ${userMailCount} piece${userMailCount !== 1 ? 's' : ''} of mail`
    : 'Processing 1,000+ pieces of mail daily';

  const headline = isReturningUser
    ? 'Welcome back!'
    : 'Leave the Print Shop & Post Office to Us';

  const subheadline = isReturningUser
    ? 'Ready to send more mail?'
    : 'We print, we stuff, we send, we track—you focus on what matters';

  const ctaText = isReturningUser
    ? 'Send Mail Now'
    : 'Start Sending Mail';

  const ctaLink = isReturningUser
    ? routes.MailCreationRoute.to
    : routes.SignupRoute.to;

  return (
    <section className={`relative min-h-[85vh] lg:min-h-[90vh] flex items-center justify-center overflow-hidden ${SPACING.SECTION_PADDING_LG}`}>
      {/* Gradient Background */}
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      {/* Animated gradient orbs */}
      <div className='absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float' />
      <div
        className='absolute bottom-20 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float'
        style={{ animationDelay: '3s' }}
      />

      <div className={`container mx-auto ${SPACING.CONTAINER_PADDING} py-20 relative z-10`}>
        <div className='grid lg:grid-cols-2 gap-12 items-center max-w-7xl mx-auto'>
          {/* Left column: Content */}
          <div className='text-center lg:text-left animate-fade-in-up'>
            {/* Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm border border-primary/20 ${SPACING.SUBHEADING_MARGIN}`}>
              <span className='w-2 h-2 bg-primary rounded-full animate-pulse' />
              <span className='text-sm font-medium text-primary'>{badge}</span>
            </div>

            {/* Main Headline with Gradient */}
            <h1 id='hero-heading' className={`text-4xl md:text-5xl lg:text-6xl font-bold ${SPACING.SUBHEADING_MARGIN} leading-tight`}>
              <span className='bg-gradient-primary bg-clip-text text-transparent'>{headline}</span>
            </h1>

            {/* Subheadline */}
            <p className={`text-xl md:text-2xl text-muted-foreground ${SPACING.SUBHEADING_MARGIN}`}>
              {subheadline}
            </p>

            {/* Sub-subheadline */}
            <p className={`text-lg text-muted-foreground/80 mb-12`}>
              No equipment to buy, no supplies to manage, no trips to the post office. From upload to mailbox in days.
            </p>

            {/* CTA Buttons */}
            <div className='flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start items-center'>
              <CTAButton href={ctaLink}>
                {ctaText}
              </CTAButton>
              {!isReturningUser && (
                <Button
                  size='lg'
                  variant='outline'
                  className='text-base md:text-lg px-8 py-6 hover:bg-primary/5 hover:scale-105 transition-all border-primary/20'
                  asChild
                >
                  <a href='#pricing'>View Pricing</a>
                </Button>
              )}
            </div>
            
            {/* Trust Indicators */}
            <div className='flex flex-wrap justify-center lg:justify-start items-center gap-4 md:gap-8 mt-12 text-sm text-muted-foreground'>
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

          {/* Right column: Visual mockup */}
          <div className='hidden lg:block animate-fade-in-up' style={{ animationDelay: '0.2s' }}>
            <div className='relative'>
              {/* Mockup container */}
              <div className='relative bg-white/5 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300'>
                {/* Dashboard preview */}
                <div className='space-y-4'>
                  {/* Header bar */}
                  <div className='flex items-center justify-between pb-4 border-b border-primary/10'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 rounded-full bg-red-500/50' />
                      <div className='w-3 h-3 rounded-full bg-yellow-500/50' />
                      <div className='w-3 h-3 rounded-full bg-green-500/50' />
                    </div>
                    <div className='text-xs text-muted-foreground/50'>postmarkr.com</div>
                  </div>
                  
                  {/* Upload area */}
                  <div className='bg-primary/5 rounded-lg p-8 border-2 border-dashed border-primary/30 text-center'>
                    <svg className='mx-auto h-12 w-12 text-primary/50 mb-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' />
                    </svg>
                    <div className='text-sm text-muted-foreground/70'>Drop your PDF here</div>
                  </div>
                  
                  {/* Form fields preview */}
                  <div className='space-y-3'>
                    <div className='h-10 bg-background/50 rounded-lg border border-primary/10'/>
                    <div className='h-10 bg-background/50 rounded-lg border border-primary/10'/>
                    <div className='h-10 bg-primary/20 rounded-lg'/>
                  </div>
                </div>

                {/* Floating elements */}
                <div className='absolute -right-4 -top-4 bg-green-500/10 backdrop-blur-sm rounded-full p-3 border border-green-500/20'>
                  <svg className='w-6 h-6 text-green-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                </div>
                <div className='absolute -left-4 -bottom-4 bg-primary/10 backdrop-blur-sm rounded-lg p-3 border border-primary/20'>
                  <div className='text-xs text-primary font-semibold'>$2.50</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
