export declare const getEmailUserFields: {
    email: (data: {
        [key: string]: unknown;
    }) => string;
    username: (data: {
        [key: string]: unknown;
    }) => string;
    isAdmin: (data: {
        [key: string]: unknown;
    }) => boolean;
};
export declare const getGoogleUserFields: {
    email: (data: {
        [key: string]: unknown;
    }) => string;
    username: (data: {
        [key: string]: unknown;
    }) => string;
    isAdmin: (data: {
        [key: string]: unknown;
    }) => boolean;
};
export declare function getGoogleAuthConfig(): {
    scopes: string[];
};
//# sourceMappingURL=userSignupFields.d.ts.map