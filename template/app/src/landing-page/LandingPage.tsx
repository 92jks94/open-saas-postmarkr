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

import { useEffect } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useNavigate } from 'react-router-dom';
import { routes } from 'wasp/client/router';
import Hero from './components/Hero';
import WhatWeHandle from './components/WhatWeHandle';
import WhoUses from './components/WhoUses';
import HowItWorks from './components/HowItWorks';
import FeaturesGrid from './components/FeaturesGrid';
import Pricing from './components/Pricing';
import Testimonials from './components/Testimonials';
import FinalCTA from './components/FinalCTA';
import FAQ from './components/FAQ';
import { Seo } from '../seo/Seo';

export default function LandingPage() {
  const { data: user, isLoading } = useAuth();

  // Show nothing while checking auth
  if (isLoading) {
    return null;
  }

  return (
    <>
      <Seo
        title="Postmarkr - Virtual Mailbox & Automated Mail Service"
        description="Send certified mail & manage business correspondence without visiting the post office. Virtual mailbox, automated mail sending, and secure digital mail management for remote teams."
        canonical="https://postmarkr.com/"
        keywords="virtual mailbox, certified mail automation, digital mail service, remote business mail, virtual print room, USPS certified mail, mail without printer, business mail management"
      />
      <div className='bg-background text-foreground'>
      <main className='isolate'>
        <section id='hero' aria-labelledby='hero-heading'>
          <Hero user={user} />
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
        <section id='final-cta' aria-labelledby='final-cta-heading'>
          <FinalCTA />
        </section>
        <section id='faq' aria-labelledby='faq-heading'>
          <FAQ />
        </section>
      </main>
    </div>
    </>
  );
}
