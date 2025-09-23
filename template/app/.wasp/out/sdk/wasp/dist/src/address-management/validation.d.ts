export declare const ADDRESS_VALIDATION_RULES: {
    readonly MAX_CONTACT_NAME_LENGTH: 100;
    readonly MAX_COMPANY_NAME_LENGTH: 100;
    readonly MAX_ADDRESS_LINE_LENGTH: 100;
    readonly MAX_CITY_LENGTH: 50;
    readonly MAX_STATE_LENGTH: 50;
    readonly MAX_POSTAL_CODE_LENGTH: 20;
    readonly MAX_COUNTRY_LENGTH: 50;
    readonly MAX_LABEL_LENGTH: 50;
};
export declare const SUPPORTED_COUNTRIES: readonly ["US", "CA", "GB", "AU", "DE", "FR", "IT", "ES", "NL", "BE", "CH", "AT", "SE", "NO", "DK", "FI"];
export declare const US_STATES: readonly ["AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA", "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"];
export declare const CANADIAN_PROVINCES: readonly ["AB", "BC", "MB", "NB", "NL", "NS", "NT", "NU", "ON", "PE", "QC", "SK", "YT"];
export declare const ADDRESS_TYPES: readonly ["sender", "recipient", "both"];
export type SupportedCountry = typeof SUPPORTED_COUNTRIES[number];
export type USState = typeof US_STATES[number];
export type CanadianProvince = typeof CANADIAN_PROVINCES[number];
export type AddressType = typeof ADDRESS_TYPES[number];
//# sourceMappingURL=validation.d.ts.map