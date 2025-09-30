/**
 * Feature flags for the mail application
 * Controls which features are enabled/disabled
 */
export const FEATURES = {
  // Mail type options
  ENABLE_POSTCARDS: false,
  ENABLE_CHECKS: false,
  ENABLE_SELF_MAILERS: false,
  ENABLE_CATALOGS: false,
  ENABLE_BOOKLETS: false,
  
  // Mail class options
  ENABLE_MULTIPLE_MAIL_CLASSES: false,
  
  // Mail size options
  ENABLE_MULTIPLE_MAIL_SIZES: false,
  
  // Printing preferences
  ENABLE_PRINTING_PREFERENCES: false,
  
  // Advanced features
  ENABLE_COLOR_PRINTING: false,
  ENABLE_DOUBLE_SIDED_OPTIONS: false,
} as const;

/**
 * Get mail type options based on feature flags
 */
export const getMailTypeOptions = () => {
  const baseOptions = [
    { value: 'letter', label: 'Letter', description: 'Standard letter format' }
  ];
  
  if (FEATURES.ENABLE_POSTCARDS) {
    baseOptions.push({ value: 'postcard', label: 'Postcard', description: 'Single-sided mail piece' });
  }
  
  if (FEATURES.ENABLE_CHECKS) {
    baseOptions.push({ value: 'check', label: 'Check', description: 'Check or payment document' });
  }
  
  if (FEATURES.ENABLE_SELF_MAILERS) {
    baseOptions.push({ value: 'self_mailer', label: 'Self Mailer', description: 'Self-contained mail piece' });
  }
  
  if (FEATURES.ENABLE_CATALOGS) {
    baseOptions.push({ value: 'catalog', label: 'Catalog', description: 'Multi-page catalog' });
  }
  
  if (FEATURES.ENABLE_BOOKLETS) {
    baseOptions.push({ value: 'booklet', label: 'Booklet', description: 'Bound booklet format' });
  }
  
  return baseOptions;
};

/**
 * Get mail class options based on feature flags
 */
export const getMailClassOptions = () => {
  const baseOptions = [
    { value: 'usps_first_class', label: 'First Class', description: 'Fastest delivery, highest priority' }
  ];
  
  if (FEATURES.ENABLE_MULTIPLE_MAIL_CLASSES) {
    baseOptions.push(
      // Standard mail disabled for MVP - requires minimum 200 pieces or 50 pounds
      // { value: 'usps_standard', label: 'Standard', description: 'Economical option for bulk mail' },
      { value: 'usps_express', label: 'Express', description: 'Overnight delivery' },
      { value: 'usps_priority', label: 'Priority', description: '1-3 business days' }
    );
  }
  
  return baseOptions;
};

/**
 * Get mail size options based on mail type and feature flags
 */
export const getMailSizeOptions = (mailType: string) => {
  const sizeOptions: Record<string, Array<{ value: string; label: string; description: string }>> = {
    'letter': [
      { value: '4x6', label: '#10 Envelope', description: 'Standard #10 business envelope (4⅛" × 9½")' }
    ],
  };
  
  if (FEATURES.ENABLE_MULTIPLE_MAIL_SIZES) {
    // Add more size options when feature is enabled
    sizeOptions['postcard'] = [
      { value: '4x6', label: '4" × 6"', description: 'Standard postcard size' }
    ];
    
    sizeOptions['letter'] = [
      { value: '4x6', label: '#10 Envelope', description: 'Standard #10 business envelope (4⅛" × 9½")' },
      { value: '6x9', label: '6" × 9"', description: 'Standard letter size' },
      { value: '6x11', label: '6" × 11"', description: 'Legal size letter' }
    ];
    
    sizeOptions['check'] = [
      { value: '6x9', label: '6" × 9"', description: 'Standard check size' }
    ];
    
    sizeOptions['self_mailer'] = [
      { value: '6x9', label: '6" × 9"', description: 'Standard self mailer' },
      { value: '6x11', label: '6" × 11"', description: 'Legal size self mailer' },
      { value: '6x18', label: '6" × 18"', description: 'Large self mailer' }
    ];
    
    sizeOptions['catalog'] = [
      { value: '9x12', label: '9" × 12"', description: 'Standard catalog size' },
      { value: '12x15', label: '12" × 15"', description: 'Large catalog' },
      { value: '12x18', label: '12" × 18"', description: 'Extra large catalog' }
    ];
    
    sizeOptions['booklet'] = [
      { value: '6x9', label: '6" × 9"', description: 'Standard booklet' },
      { value: '9x12', label: '9" × 12"', description: 'Large booklet' }
    ];
  }
  
  return sizeOptions[mailType] || sizeOptions['letter'];
};

export type FeatureFlags = typeof FEATURES;
