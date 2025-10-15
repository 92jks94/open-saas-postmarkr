import { LucideIcon } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { CARD_STYLES, TEXT_STYLES } from '../constants';
import IconContainer from './IconContainer';

interface FeatureCardProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  animationDelay?: string;
  className?: string;
  iconVariant?: 'primary' | 'muted' | 'avatar';
  iconSize?: 'sm' | 'md';
  withHoverScale?: boolean;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
  animationDelay,
  className = '',
  iconVariant = 'primary',
  iconSize = 'sm',
  withHoverScale = true
}: FeatureCardProps) {
  return (
    <Card
      className={`${CARD_STYLES.GROUP} ${className}`}
      style={animationDelay ? { animationDelay } : undefined}
    >
      {Icon && (
        <IconContainer
          icon={Icon}
          variant={iconVariant}
          size={iconSize}
          withHoverScale={withHoverScale}
          className="mb-4"
        />
      )}
      
      <h3 className={`${TEXT_STYLES.CARD_HEADING} mb-3 group-hover:text-primary transition-colors`}>
        {title}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </Card>
  );
}
