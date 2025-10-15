import { LucideIcon } from 'lucide-react';
import { ICON_CONTAINER_STYLES, SPACING } from '../constants';

interface IconContainerProps {
  icon?: LucideIcon;
  variant?: 'primary' | 'muted' | 'avatar';
  size?: 'sm' | 'md';
  withHoverScale?: boolean;
  children?: string; // For avatar initials
  className?: string;
}

export default function IconContainer({
  icon: Icon,
  variant = 'primary',
  size = 'sm',
  withHoverScale = false,
  children,
  className = ''
}: IconContainerProps) {
  const sizeClass = size === 'sm' ? SPACING.ICON_CONTAINER_SM : SPACING.ICON_CONTAINER_MD;
  const iconSize = size === 'sm' ? SPACING.ICON_MD : SPACING.ICON_LG;
  
  let styleClass = '';
  if (variant === 'primary') {
    styleClass = withHoverScale ? ICON_CONTAINER_STYLES.PRIMARY_HOVER : ICON_CONTAINER_STYLES.PRIMARY;
  } else if (variant === 'muted') {
    styleClass = ICON_CONTAINER_STYLES.MUTED;
  } else if (variant === 'avatar') {
    styleClass = ICON_CONTAINER_STYLES.AVATAR;
  }

  return (
    <div className={`${sizeClass} ${styleClass} ${className}`}>
      {Icon && <Icon className={iconSize} />}
      {children && <span>{children}</span>}
    </div>
  );
}
