import { Briefcase, Scale, Home, Users, Globe } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { SPACING, CARD_STYLES } from '../constants';
import SectionHeader from './SectionHeader';
import FeatureCard from './FeatureCard';

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
    <section className={`${SPACING.SECTION_PADDING_LG} relative overflow-hidden`}>
      <div className='absolute inset-0 bg-gradient-subtle -z-10' />

      <div className={`container mx-auto ${SPACING.CONTAINER_PADDING}`}>
        <SectionHeader
          id="who-uses-heading"
          title="Who Uses"
          highlightedText="Postmarkr?"
          subtitle="Trusted by professionals across industries who need reliable mail services"
        />

        <div className={`grid md:grid-cols-2 lg:grid-cols-3 ${SPACING.GRID_GAP} max-w-7xl mx-auto`}>
          {useCases.map((useCase, index) => (
            <FeatureCard
              key={index}
              icon={useCase.icon}
              title={useCase.title}
              description={useCase.description}
              animationDelay={`${index * 0.1}s`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

