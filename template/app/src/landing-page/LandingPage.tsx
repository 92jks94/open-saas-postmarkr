// ============================================================================
// LANDING PAGE
// ============================================================================
// This file contains the main landing page component for the marketing site.
// It orchestrates all the marketing sections and provides the public-facing
// interface for the application.
//
// Page Sections:
// - Hero: Main value proposition and CTA
// - HowItWorks: Step-by-step workflow demonstration
// - Features: Key features and benefits
// - Pricing: Pricing plans and options
// - Testimonials: Social proof and customer stories
// - FAQ: Common questions and answers

import Hero from './components/Hero';
import WhatWeHandle from './components/WhatWeHandle';
import WhoUses from './components/WhoUses';
import HowItWorks from './components/HowItWorks';
import FeaturesGrid from './components/FeaturesGrid';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';

export default function LandingPage() {
  return (
    <div className='bg-background text-foreground'>
      <main className='isolate'>
        <section id='hero' aria-labelledby='hero-heading'>
          <Hero />
        </section>
        <section id='what-we-handle' aria-labelledby='what-we-handle-heading'>
          <WhatWeHandle />
        </section>
        <section id='who-uses' aria-labelledby='who-uses-heading'>
          <WhoUses />
        </section>
        <section id='how-it-works' aria-labelledby='workflow-heading'>
          <HowItWorks />
        </section>
        <section id='features' aria-labelledby='features-heading'>
          <FeaturesGrid />
        </section>
        <section id='pricing' aria-labelledby='pricing-heading'>
          <Pricing />
        </section>
        <section id='testimonials' aria-labelledby='testimonials-heading'>
          <Testimonials />
        </section>
        <section id='faq' aria-labelledby='faq-heading'>
          <FAQ />
        </section>
      </main>
    </div>
  );
}
