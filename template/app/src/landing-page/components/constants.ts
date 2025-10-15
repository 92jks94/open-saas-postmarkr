export const TEXT_STYLES = {
  SECTION_HEADING: 'text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900',
  SECTION_SUBHEADING: 'text-lg md:text-xl text-gray-600',
  HERO_TITLE: 'text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900',
  HERO_SUBTITLE: 'text-lg md:text-xl text-gray-600',
  FEATURE_TITLE: 'text-xl md:text-2xl font-semibold text-gray-900',
  FEATURE_DESCRIPTION: 'text-base text-gray-600',
  TESTIMONIAL_TEXT: 'text-lg text-gray-700',
  TESTIMONIAL_AUTHOR: 'text-sm font-medium text-gray-900',
  PRICING_TITLE: 'text-2xl md:text-3xl font-bold text-gray-900',
  PRICING_PRICE: 'text-4xl md:text-5xl font-bold text-gray-900',
  PRICING_DESCRIPTION: 'text-base text-gray-600',
  FAQ_QUESTION: 'text-lg font-semibold text-gray-900',
  FAQ_ANSWER: 'text-base text-gray-600',
} as const;

export const SPACING = {
  SECTION_TITLE_MARGIN: 'mb-8 md:mb-12',
  HEADING_MARGIN: 'mb-4 md:mb-6',
  FEATURE_MARGIN: 'mb-6 md:mb-8',
  TESTIMONIAL_MARGIN: 'mb-4',
  PRICING_MARGIN: 'mb-6',
  FAQ_MARGIN: 'mb-4',
  CONTAINER_PADDING: 'px-4 md:px-6 lg:px-8',
  SECTION_PADDING: 'py-12 md:py-16 lg:py-20',
} as const;

export const COLORS = {
  PRIMARY: 'bg-blue-600',
  PRIMARY_HOVER: 'hover:bg-blue-700',
  SECONDARY: 'bg-gray-100',
  SECONDARY_HOVER: 'hover:bg-gray-200',
  ACCENT: 'bg-green-600',
  ACCENT_HOVER: 'hover:bg-green-700',
  TEXT_PRIMARY: 'text-gray-900',
  TEXT_SECONDARY: 'text-gray-600',
  TEXT_ACCENT: 'text-blue-600',
} as const;

export const GRADIENTS = {
  PRIMARY: 'bg-gradient-to-r from-blue-600 to-blue-700',
  ACCENT: 'bg-gradient-to-r from-green-500 to-green-600',
  HERO: 'bg-gradient-to-br from-blue-50 to-indigo-100',
  FEATURE: 'bg-gradient-to-br from-gray-50 to-blue-50',
} as const;

export const ANIMATIONS = {
  FADE_IN_UP: 'animate-fade-in-up',
  FADE_IN_LEFT: 'animate-fade-in-left',
  FADE_IN_RIGHT: 'animate-fade-in-right',
  SCALE_IN: 'animate-scale-in',
  BOUNCE: 'animate-bounce',
} as const;
