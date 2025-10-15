import { FileText, MapPinCheck, Mail, Globe, Shield, Bell, FolderOpen, CheckCircle, Zap } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { SPACING, CARD_STYLES } from '../constants';
import SectionHeader from './SectionHeader';
import FeatureCard from './FeatureCard';

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
    <section className={`${SPACING.SECTION_PADDING_LG} relative`}>
      <div className={`container mx-auto ${SPACING.CONTAINER_PADDING}`}>
        <SectionHeader
          id="features-heading"
          title="Everything you need to send"
          highlightedText="professional mail"
          subtitle="Powerful features designed for modern remote professionals"
          highlightType="accent"
        />

        {/* Bento Grid Layout */}
        <div className={`grid md:grid-cols-2 lg:grid-cols-3 ${SPACING.GRID_GAP} max-w-7xl mx-auto`}>
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              animationDelay={`${index * 0.05}s`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
