import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../../components/ui/accordion';

const faqs = [
  {
    question: 'How long does delivery take?',
    answer:
      'Delivery times vary by service: First Class (2-5 business days), Priority (1-3 business days), Express (overnight), and Certified (2-5 business days with signature confirmation). All timelines begin once your document is printed and shipped.',
  },
  {
    question: 'What file formats do you accept?',
    answer:
      'We currently accept PDF files up to 50 pages. Your documents should be formatted for standard 8.5" x 11" paper. We automatically optimize your files for professional printing while maintaining quality.',
  },
  {
    question: 'Is my document secure?',
    answer:
      'Absolutely. We use bank-level 256-bit encryption for all uploads and transmissions. Your documents are securely stored, printed in a secure facility, and then permanently deleted after 30 days. We never share your information with third parties.',
  },
  {
    question: 'Can I send mail internationally?',
    answer:
      'Currently, we only support domestic US mail delivery. International shipping is on our roadmap and will be available soon. Sign up for our newsletter to be notified when international services launch.',
  },
  {
    question: "What if the recipient doesn't receive my mail?",
    answer:
      "All our services include tracking, so you can monitor delivery status in real-time. If there's a delivery issue, our support team will work with USPS to resolve it. Certified and Express mail include additional insurance and signature confirmation for extra security.",
  },
  {
    question: 'Can I schedule mail to be sent later?',
    answer:
      'Yes! You can schedule your mail to be sent on a specific date up to 30 days in advance. This is perfect for sending time-sensitive documents or planning ahead for business correspondence.',
  },
];

export default function FAQ() {
  return (
    <section className='py-24 relative'>
      <div className='container mx-auto px-4'>
        <div className='text-center mb-16 animate-fade-in-up'>
          <h2 id='faq-heading' className='text-4xl md:text-5xl font-bold mb-4'>
            Frequently Asked{' '}
            <span className='bg-gradient-primary bg-clip-text text-transparent'>Questions</span>
          </h2>
          <p className='text-xl text-muted-foreground max-w-2xl mx-auto'>
            Everything you need to know about using Postmarkr
          </p>
        </div>

        <div className='max-w-3xl mx-auto animate-fade-in-up' style={{ animationDelay: '0.1s' }}>
          <Accordion type='single' collapsible className='space-y-4'>
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className='border border-border rounded-lg px-6 bg-card/50 backdrop-blur hover:border-primary/50 transition-colors'
              >
                <AccordionTrigger className='text-left hover:text-primary hover:no-underline py-6'>
                  <span className='font-semibold text-lg'>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className='text-muted-foreground pb-6 leading-relaxed'>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
