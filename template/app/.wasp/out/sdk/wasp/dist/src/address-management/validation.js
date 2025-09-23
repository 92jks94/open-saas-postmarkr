// Address validation constants and schemas
// Following the pattern from src/file-upload/validation.ts
export const ADDRESS_VALIDATION_RULES = {
    MAX_CONTACT_NAME_LENGTH: 100,
    MAX_COMPANY_NAME_LENGTH: 100,
    MAX_ADDRESS_LINE_LENGTH: 100,
    MAX_CITY_LENGTH: 50,
    MAX_STATE_LENGTH: 50,
    MAX_POSTAL_CODE_LENGTH: 20,
    MAX_COUNTRY_LENGTH: 50,
    MAX_LABEL_LENGTH: 50,
};
export const SUPPORTED_COUNTRIES = [
    'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'
];
export const US_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];
export const CANADIAN_PROVINCES = [
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE', 'QC', 'SK', 'YT'
];
export const ADDRESS_TYPES = ['sender', 'recipient', 'both'];
//# sourceMappingURL=validation.js.map