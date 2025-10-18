import { SPACING } from '../constants';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Button } from '../../components/ui/button';
import { Seo } from '../../seo/Seo';

export default function AboutPage() {
  return (
    <>
      <Seo
        title="About Postmarkr - Making Physical Mail Simple"
        description="Making physical mail simple for remote businesses and modern professionals. Learn about our mission to provide professional mail services accessible from anywhere."
        canonical="https://postmarkr.com/about"
      />
      <div className='bg-background text-foreground min-h-screen'>
      <main className={`${SPACING.SECTION_PADDING_LG}`}>
        <div className={`container mx-auto ${SPACING.CONTAINER_PADDING} max-w-4xl`}>
          {/* Header */}
          <div className='text-center mb-16'>
            <h1 className='text-4xl md:text-5xl font-bold mb-6'>
              About <span className='bg-gradient-primary bg-clip-text text-transparent'>Postmarkr</span>
            </h1>
            <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
              Making physical mail simple for remote businesses and modern professionals
            </p>
          </div>

          {/* Mission Section */}
          <section className='mb-16'>
            <h2 className='text-2xl font-bold mb-4'>Our Mission</h2>
            <p className='text-muted-foreground leading-relaxed mb-4'>
              In an increasingly digital world, physical mail remains essential for legal documents, contracts, 
              and official correspondence. Yet traditional mailing requires office infrastructure, supplies, 
              and time-consuming trips to the post office.
            </p>
            <p className='text-muted-foreground leading-relaxed'>
              Postmarkr bridges this gap by providing professional mail services accessible from anywhere. 
              Whether you're a digital nomad in Bali, a remote consultant in Barcelona, or a work-from-home 
              business owner, we handle all the logistics of printing, addressing, and mailing your documents.
            </p>
          </section>

          {/* What We Do Section */}
          <section className='mb-16'>
            <h2 className='text-2xl font-bold mb-4'>What We Do</h2>
            <div className='space-y-4'>
              <div className='flex gap-4'>
                <div className='flex-shrink-0'>
                  <div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center'>
                    <span className='text-xl'>📄</span>
                  </div>
                </div>
                <div>
                  <h3 className='font-semibold mb-1'>Professional Printing</h3>
                  <p className='text-muted-foreground'>
                    High-quality color and black & white printing on premium paper stock
                  </p>
                </div>
              </div>
              <div className='flex gap-4'>
                <div className='flex-shrink-0'>
                  <div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center'>
                    <span className='text-xl'>✉️</span>
                  </div>
                </div>
                <div>
                  <h3 className='font-semibold mb-1'>Complete Mailing Service</h3>
                  <p className='text-muted-foreground'>
                    Envelope addressing, stuffing, and submission to USPS with multiple service levels
                  </p>
                </div>
              </div>
              <div className='flex gap-4'>
                <div className='flex-shrink-0'>
                  <div className='w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center'>
                    <span className='text-xl'>📊</span>
                  </div>
                </div>
                <div>
                  <h3 className='font-semibold mb-1'>Real-time Tracking</h3>
                  <p className='text-muted-foreground'>
                    Monitor your mail from printing to delivery with USPS tracking numbers
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Who We Serve Section */}
          <section className='mb-16'>
            <h2 className='text-2xl font-bold mb-4'>Who We Serve</h2>
            <p className='text-muted-foreground leading-relaxed mb-4'>
              Postmarkr is built for modern professionals who need traditional mail services without 
              traditional office infrastructure:
            </p>
            <ul className='space-y-2 text-muted-foreground'>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-1'>•</span>
                <span>Remote businesses and distributed teams</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-1'>•</span>
                <span>Legal professionals sending discovery documents and notices</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-1'>•</span>
                <span>Real estate agents managing contracts and disclosures</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-1'>•</span>
                <span>HR teams distributing employment documents</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-primary mt-1'>•</span>
                <span>Freelancers and consultants working from anywhere</span>
              </li>
            </ul>
          </section>

          {/* Values Section */}
          <section className='mb-16'>
            <h2 className='text-2xl font-bold mb-4'>Our Values</h2>
            <div className='grid md:grid-cols-3 gap-6'>
              <div className='text-center'>
                <div className='w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3'>
                  <span className='text-2xl'>🚀</span>
                </div>
                <h3 className='font-semibold mb-2'>Simplicity</h3>
                <p className='text-sm text-muted-foreground'>
                  Make sending physical mail as easy as sending an email
                </p>
              </div>
              <div className='text-center'>
                <div className='w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3'>
                  <span className='text-2xl'>🔒</span>
                </div>
                <h3 className='font-semibold mb-2'>Security</h3>
                <p className='text-sm text-muted-foreground'>
                  Bank-level encryption and secure handling of sensitive documents
                </p>
              </div>
              <div className='text-center'>
                <div className='w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3'>
                  <span className='text-2xl'>⚡</span>
                </div>
                <h3 className='font-semibold mb-2'>Reliability</h3>
                <p className='text-sm text-muted-foreground'>
                  Professional service you can depend on for important documents
                </p>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className='text-center bg-primary/5 rounded-2xl p-8 md:p-12'>
            <h2 className='text-2xl md:text-3xl font-bold mb-4'>
              Ready to simplify your mail?
            </h2>
            <p className='text-muted-foreground mb-6 max-w-2xl mx-auto'>
              Join thousands of remote professionals using Postmarkr to send physical mail from anywhere.
            </p>
            <Button size='lg' asChild>
              <WaspRouterLink to={routes.SignupRoute.to}>
                Get Started Now
              </WaspRouterLink>
            </Button>
          </section>
        </div>
      </main>
    </div>
    </>
  );
}

