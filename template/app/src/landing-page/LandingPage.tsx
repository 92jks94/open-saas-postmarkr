// ============================================================================
// LANDING PAGE
// ============================================================================
// This file contains the main landing page component for the marketing site.
// It orchestrates all the marketing sections and provides the public-facing
// interface for the application.
//
// Page Sections:
// - Hero: Main value proposition and CTA
// - Examples: Product demonstrations and use cases
// - Features: Key features and benefits
// - Testimonials: Social proof and customer stories
// - FAQ: Common questions and answers
// - Footer: Navigation and legal links

import WorkflowSteps from './components/WorkflowSteps';
import FAQ from './components/FAQ';
import FeaturesGrid from './components/FeaturesGrid';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Testimonials from './components/Testimonials';
import AIReady from './ExampleHighlightedFeature';
import { workflowSteps, faqs, features, footerNavigation, testimonials } from './contentSections';

export default function LandingPage() {
  return (
    <div className='bg-background text-foreground'>
      <main className='isolate'>
        <section id="hero" aria-labelledby="hero-heading">
          <Hero />
        </section>
        <section id="workflow" aria-labelledby="workflow-heading">
          <WorkflowSteps steps={workflowSteps} />
        </section>
        <section id="features" aria-labelledby="features-heading">
          <FeaturesGrid features={features} />
        </section>
        <section id="pricing" aria-labelledby="pricing-heading" className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 id="pricing-heading" className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Simple <span className="text-primary">pricing</span>
              </h2>
              <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground">
                Perfect for remote workers. Pay per page for mail service. No subscriptions, no hidden fees.
              </p>
            </div>
            <div className="mt-16 flex justify-center">
              <div className="bg-muted/50 rounded-lg p-8 max-w-md w-full">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-foreground mb-4">Per-Page Pricing</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">1-5 pages</span>
                      <span className="font-semibold">$0.50 per page</span>
                    </div>
                    <div className="flex justify-between items-center relative">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">6-20 pages</span>
                        <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded-full">
                          Most Popular
                        </span>
                      </div>
                      <span className="font-semibold">$0.375 per page</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">21-60 pages</span>
                      <span className="font-semibold">$0.25 per page</span>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      <div className="flex justify-between items-center mb-1">
                        <span>Plus postage:</span>
                        <span className="font-medium">~$0.60 per mail</span>
                      </div>
                      <div className="text-xs text-muted-foreground/80">
                        Example: 5 pages = $2.50 + $0.60 postage = $3.10 total
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">
                    All mail includes tracking and delivery confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section id="testimonials" aria-labelledby="testimonials-heading">
          <Testimonials testimonials={testimonials} />
        </section>
        <section id="faq" aria-labelledby="faq-heading">
          <FAQ faqs={faqs} />
        </section>
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}

