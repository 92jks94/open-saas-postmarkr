/**
 * Shared constants for landing page components
 * Single source of truth for spacing, styling, and design tokens
 */

export const SPACING = {
  // Section padding
  SECTION_PADDING_SM: 'py-16 md:py-20',
  SECTION_PADDING_LG: 'py-20 md:py-24',
  
  // Container padding
  CONTAINER_PADDING: 'px-4 md:px-6 lg:px-8',
  
  // Icon containers
  ICON_CONTAINER_SM: 'w-12 h-12',
  ICON_CONTAINER_MD: 'w-14 h-14',
  
  // Icon sizes
  ICON_SM: 'w-5 h-5',
  ICON_MD: 'w-6 h-6',
  ICON_LG: 'w-7 h-7',
  
  // Margins
  SECTION_TITLE_MARGIN: 'mb-16',
  HEADING_MARGIN: 'mb-4',
  SUBHEADING_MARGIN: 'mb-8',
  
  // Gaps
  GRID_GAP: 'gap-6',
  GRID_GAP_LG: 'gap-8',
} as const;

export const CARD_STYLES = {
  BASE: 'p-6 md:p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass hover:-translate-y-1',
  WITH_ANIMATION: 'p-6 md:p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass hover:-translate-y-1 animate-fade-in-up',
  GROUP: 'p-6 md:p-8 bg-card/50 backdrop-blur border-border hover:border-primary/50 transition-all duration-300 hover:shadow-glass hover:-translate-y-1 group animate-fade-in-up',
} as const;

export const ICON_CONTAINER_STYLES = {
  PRIMARY: 'rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow',
  PRIMARY_HOVER: 'rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow group-hover:scale-110 transition-transform',
  MUTED: 'rounded-xl bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center',
  AVATAR: 'rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-semibold text-lg',
} as const;

export const TEXT_STYLES = {
  SECTION_HEADING: 'text-3xl md:text-4xl lg:text-5xl font-bold',
  SECTION_SUBHEADING: 'text-lg md:text-xl text-muted-foreground',
  CARD_HEADING: 'text-lg md:text-xl font-semibold',
} as const;
