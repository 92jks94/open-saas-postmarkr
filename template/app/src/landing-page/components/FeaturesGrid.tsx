import { FileText, MapPinCheck, Mail, Globe, Shield, Bell, FolderOpen, CheckCircle, Zap } from 'lucide-react';
import { Card } from '../../components/ui/card';

const features = [
  {
    icon: FileText,
    title: 'PDF Upload',
    description: 'Upload any PDF document directly from your device with drag-and-drop simplicity',
  },
  {
    icon: MapPinCheck,
    title: 'Address Validation',
    description: 'Automatic verification ensures your mail reaches the right destination every time',
  },
  {
    icon: Mail,
    title: 'Mail Service Selection',
    description: 'Choose from First Class, Certified, Priority, or Express delivery options',
  },
  {
    icon: Zap,
    title: 'Real-time Tracking',
    description: "Monitor your mail's journey from printing to delivery with live updates",
  },
  {
    icon: CheckCircle,
    title: 'Professional Delivery',
    description: 'High-quality printing and secure handling ensures professional presentation',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Bank-level encryption protects your payment information and transactions',
  },
  {
    icon: FolderOpen,
    title: 'Address Management',
    description: 'Save frequently used addresses for quick sending in the future',
  },
  {
    icon: Bell,
    title: 'Delivery Notifications',
    description: 'Get instant alerts when your mail is printed, shipped, and delivered',
  },
  {
    icon: Globe,
    title: 'Work from Anywhere',
    description: 'Send physical mail from any location with just an internet connection',
  },
];

export default function FeaturesGrid() {
  return (
    <section className='py-16 md:py-20 relative'>
      <div className='container mx-auto px-4 md:px-6 lg:px-8'>
        <div className='text-center mb-16 animate-fade-in-up'>
          <h2 id='features-heading' className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'>
            Everything you need to send{' '}
            <span className='bg-gradient-accent bg-clip-text text-transparent'>professional mail</span>
          </h2>
          <p className='text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto'>
            Powerful features designed for modern remote professionals
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto'>
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isLarge = index === 0 || index === 4;

            return (
              <Card
                key={feature.title}
                className={`p-6 md:p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass hover:-translate-y-1 group animate-fade-in-up ${
                  isLarge ? 'lg:col-span-1 lg:row-span-1' : ''
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                {/* Icon with gradient background */}
                <div className='w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-md'>
                  <Icon className='w-6 h-6 text-primary-foreground' />
                </div>

                {/* Content */}
                <h3 className='text-lg md:text-xl font-semibold mb-3 group-hover:text-primary transition-colors'>{feature.title}</h3>
                <p className='text-muted-foreground leading-relaxed'>{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
