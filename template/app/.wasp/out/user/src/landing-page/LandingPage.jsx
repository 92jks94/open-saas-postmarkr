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
import ExamplesCarousel from './components/ExamplesCarousel';
import FAQ from './components/FAQ';
import FeaturesGrid from './components/FeaturesGrid';
import Footer from './components/Footer';
import Hero from './components/Hero';
import Testimonials from './components/Testimonials';
import AIReady from './ExampleHighlightedFeature';
import { examples, faqs, features, footerNavigation, testimonials } from './contentSections';
export default function LandingPage() {
    return (<div className='bg-background text-foreground'>
      <main className='isolate'>
        <Hero />
        <ExamplesCarousel examples={examples}/>
        <AIReady />
        <FeaturesGrid features={features}/>
        <Testimonials testimonials={testimonials}/>
        <FAQ faqs={faqs}/>
      </main>
      <Footer footerNavigation={footerNavigation}/>
    </div>);
}
