import { Upload, Mail, MapPin, PackageCheck } from 'lucide-react';
import { Card } from '../../components/ui/card';

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
    <section className='py-20 md:py-24 relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      <div className='container mx-auto px-4 md:px-6 lg:px-8'>
        <div className='text-center mb-16 animate-fade-in-up'>
          <h2 id='workflow-heading' className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'>
            How It <span className='bg-gradient-primary bg-clip-text text-transparent'>Works</span>
          </h2>
          <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
            Send physical mail in four simple steps. No post office required.
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto'>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={step.number}
                className='relative p-6 md:p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass hover:-translate-y-1 group animate-fade-in-up'
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Step Number */}
                <div className='absolute top-6 right-6 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors'>
                  {step.number}
                </div>

                {/* Icon */}
                <div className='w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center mb-6 shadow-glow group-hover:scale-110 transition-transform'>
                  <Icon className='w-7 h-7 text-primary-foreground' />
                </div>

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

