import { Upload, Mail, MapPin, PackageCheck } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { SPACING, CARD_STYLES } from '../constants';
import SectionHeader from './SectionHeader';
import IconContainer from './IconContainer';

const steps = [
  {
    icon: Upload,
    number: '01',
    title: 'Upload Your Document',
    description: 'Simply drag and drop your PDF or use our easy upload interface',
  },
  {
    icon: Mail,
    number: '02',
    title: 'Choose Mail Service',
    description: 'Select from First Class, Certified, Priority, or Express delivery',
  },
  {
    icon: MapPin,
    number: '03',
    title: 'Add Addresses',
    description: 'Enter recipient addresses with our smart validation system',
  },
  {
    icon: PackageCheck,
    number: '04',
    title: 'Track Delivery',
    description: 'Monitor your mail in real-time from printing to delivery',
  },
];

export default function HowItWorks() {
  return (
    <section className={`${SPACING.SECTION_PADDING_LG} relative overflow-hidden`}>
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      <div className={`container mx-auto ${SPACING.CONTAINER_PADDING}`}>
        <SectionHeader
          id="workflow-heading"
          title="How It"
          highlightedText="Works"
          subtitle="Send physical mail in four simple steps. No post office required."
        />

        <div className={`grid md:grid-cols-2 lg:grid-cols-4 ${SPACING.GRID_GAP} max-w-7xl mx-auto`}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.number}
                className={`relative ${CARD_STYLES.GROUP}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Step Number */}
                <div className='absolute top-6 right-6 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors'>
                  {step.number}
                </div>

                {/* Icon */}
                <IconContainer
                  icon={Icon}
                  variant="primary"
                  size="sm"
                  withHoverScale={true}
                  className="mb-6"
                />

                {/* Content */}
                <h3 className='text-lg md:text-xl font-semibold mb-3'>{step.title}</h3>
                <p className='text-muted-foreground'>{step.description}</p>

                {/* Connector Line (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className='hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-gradient-to-r from-primary/50 to-transparent' />
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

