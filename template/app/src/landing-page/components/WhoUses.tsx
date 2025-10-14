import { Briefcase, Scale, Home, Users, Globe } from 'lucide-react';
import { Card } from '../../components/ui/card';

const useCases = [
  {
    icon: Briefcase,
    title: 'Remote Businesses',
    description: 'Send invoices, contracts, and notices without office infrastructure',
  },
  {
    icon: Scale,
    title: 'Legal Professionals',
    description: 'Deliver discovery documents, notices, and court documents reliably',
  },
  {
    icon: Home,
    title: 'Real Estate Agents',
    description: 'Send offers, disclosures, and contracts from anywhere',
  },
  {
    icon: Users,
    title: 'HR Teams',
    description: 'Distribute employment documents, benefits info, and official notices',
  },
  {
    icon: Globe,
    title: 'Anyone Working Remotely',
    description: 'Anyone who needs professional mail without office infrastructure',
  },
];

export default function WhoUses() {
  return (
    <section className='py-16 md:py-20 relative overflow-hidden'>
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      <div className='container mx-auto px-4 md:px-6 lg:px-8'>
        <div className='text-center mb-16 animate-fade-in-up'>
          <h2 id='who-uses-heading' className='text-3xl md:text-4xl lg:text-5xl font-bold mb-4'>
            Who Uses <span className='bg-gradient-primary bg-clip-text text-transparent'>Postmarkr?</span>
          </h2>
          <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto'>
            Trusted by professionals across industries who need reliable mail services
          </p>
        </div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto'>
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon;
            return (
              <Card
                key={index}
                className='p-6 md:p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass hover:-translate-y-1 group animate-fade-in-up'
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Icon */}
                <div className='w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center mb-4 shadow-glow group-hover:scale-110 transition-transform'>
                  <Icon className='w-6 h-6 text-primary-foreground' />
                </div>

                {/* Content */}
                <h3 className='text-lg md:text-xl font-semibold mb-2'>{useCase.title}</h3>
                <p className='text-muted-foreground'>{useCase.description}</p>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

