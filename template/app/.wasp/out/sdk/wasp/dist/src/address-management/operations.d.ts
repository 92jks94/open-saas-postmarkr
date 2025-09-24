import * as z from 'zod';
import { type MailAddress } from 'wasp/entities';
import { type CreateMailAddress, type DeleteMailAddress, type GetMailAddressesByUser, type UpdateMailAddress } from 'wasp/server/operations';
declare const createMailAddressInputSchema: z.ZodObject<{
    contactName: z.ZodString;
    companyName: z.ZodOptional<z.ZodString>;
    addressLine1: z.ZodString;
    addressLine2: z.ZodOptional<z.ZodString>;
    city: z.ZodString;
    state: z.ZodString;
    postalCode: z.ZodString;
    country: z.ZodString;
    label: z.ZodOptional<z.ZodString>;
    addressType: z.ZodDefault<z.ZodEnum<["sender", "recipient", "both"]>>;
}, "strip", z.ZodTypeAny, {
    contactName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: "sender" | "recipient" | "both";
    companyName?: string | undefined;
    addressLine2?: string | undefined;
    label?: string | undefined;
}, {
    contactName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    companyName?: string | undefined;
    addressLine2?: string | undefined;
    label?: string | undefined;
    addressType?: "sender" | "recipient" | "both" | undefined;
}>;
type CreateMailAddressInput = z.infer<typeof createMailAddressInputSchema>;
export declare const createMailAddress: CreateMailAddress<CreateMailAddressInput, MailAddress>;
export declare const getMailAddressesByUser: GetMailAddressesByUser<void, MailAddress[]>;
export declare const deleteMailAddress: DeleteMailAddress<{
    id: string;
}, MailAddress>;
declare const updateMailAddressInputSchema: z.ZodObject<{
    id: z.ZodString;
    data: z.ZodObject<{
        contactName: z.ZodOptional<z.ZodString>;
        companyName: z.ZodOptional<z.ZodString>;
        addressLine1: z.ZodOptional<z.ZodString>;
        addressLine2: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        postalCode: z.ZodOptional<z.ZodString>;
        country: z.ZodOptional<z.ZodString>;
        label: z.ZodOptional<z.ZodString>;
        addressType: z.ZodOptional<z.ZodEnum<["sender", "recipient", "both"]>>;
    }, "strip", z.ZodTypeAny, {
        contactName?: string | undefined;
        companyName?: string | undefined;
        addressLine1?: string | undefined;
        addressLine2?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        label?: string | undefined;
        addressType?: "sender" | "recipient" | "both" | undefined;
    }, {
        contactName?: string | undefined;
        companyName?: string | undefined;
        addressLine1?: string | undefined;
        addressLine2?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        label?: string | undefined;
        addressType?: "sender" | "recipient" | "both" | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    data: {
        contactName?: string | undefined;
        companyName?: string | undefined;
        addressLine1?: string | undefined;
        addressLine2?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        label?: string | undefined;
        addressType?: "sender" | "recipient" | "both" | undefined;
    };
    id: string;
}, {
    data: {
        contactName?: string | undefined;
        companyName?: string | undefined;
        addressLine1?: string | undefined;
        addressLine2?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        postalCode?: string | undefined;
        country?: string | undefined;
        label?: string | undefined;
        addressType?: "sender" | "recipient" | "both" | undefined;
    };
    id: string;
}>;
type UpdateMailAddressInput = z.infer<typeof updateMailAddressInputSchema>;
export declare const updateMailAddress: UpdateMailAddress<UpdateMailAddressInput, MailAddress>;
export declare const setDefaultAddress: UpdateMailAddress<{
    id: string;
}, MailAddress>;
export {};
//# sourceMappingURL=operations.d.ts.map