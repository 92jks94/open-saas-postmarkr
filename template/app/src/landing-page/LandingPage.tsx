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
import Navigation from './components/Navigation';
import AIReady from './ExampleHighlightedFeature';
import { workflowSteps, faqs, features, footerNavigation, testimonials } from './contentSections';

export default function LandingPage() {
  return (
    <div className='bg-background text-foreground'>
      <Navigation />
      <main className='isolate'>
        <div id="hero">
          <Hero />
        </div>
        <WorkflowSteps steps={workflowSteps} />
        <div id="features">
          <FeaturesGrid features={features} />
        </div>
        <div id="pricing" className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h2 className="mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
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
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">6-20 pages</span>
                      <span className="font-semibold">$0.375 per page</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">21-60 pages</span>
                      <span className="font-semibold">$0.25 per page</span>
                    </div>
                  </div>
                  <p className="mt-6 text-sm text-muted-foreground">
                    Plus postage costs. All mail includes tracking and delivery confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div id="testimonials">
          <Testimonials testimonials={testimonials} />
        </div>
        <div id="faq">
          <FAQ faqs={faqs} />
        </div>
      </main>
      <Footer footerNavigation={footerNavigation} />
    </div>
  );
}

