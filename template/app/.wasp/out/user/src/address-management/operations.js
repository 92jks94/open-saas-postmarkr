import * as z from 'zod';
import { HttpError } from 'wasp/server';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
// Copy the exact validation pattern from file-upload
const createMailAddressInputSchema = z.object({
    contactName: z.string().nonempty(),
    companyName: z.string().optional(),
    addressLine1: z.string().nonempty(),
    addressLine2: z.string().optional(),
    city: z.string().nonempty(),
    state: z.string().nonempty(),
    postalCode: z.string().nonempty(),
    country: z.string().nonempty(),
    label: z.string().optional(),
    addressType: z.enum(['sender', 'recipient', 'both']).default('both'),
});
export const createMailAddress = async (rawArgs, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    const data = ensureArgsSchemaOrThrowHttpError(createMailAddressInputSchema, rawArgs);
    // Follow exact same pattern as createFile
    const address = await context.entities.MailAddress.create({
        data: {
            ...data,
            user: { connect: { id: context.user.id } },
        },
    });
    return address;
};
// Copy getAllFilesByUser pattern exactly
export const getMailAddressesByUser = async (_args, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    return context.entities.MailAddress.findMany({
        where: {
            user: {
                id: context.user.id,
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
};
// Copy deleteFile pattern exactly
export const deleteMailAddress = async (rawArgs, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    const { id } = ensureArgsSchemaOrThrowHttpError(z.object({ id: z.string().nonempty() }), rawArgs);
    return context.entities.MailAddress.delete({
        where: {
            id,
            user: {
                id: context.user.id,
            },
        },
    });
};
// Update address operation
const updateMailAddressInputSchema = z.object({
    id: z.string().nonempty(),
    data: z.object({
        contactName: z.string().optional(),
        companyName: z.string().optional(),
        addressLine1: z.string().optional(),
        addressLine2: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        postalCode: z.string().optional(),
        country: z.string().optional(),
        label: z.string().optional(),
        addressType: z.enum(['sender', 'recipient', 'both']).optional(),
    }),
});
export const updateMailAddress = async (rawArgs, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    const { id, data } = ensureArgsSchemaOrThrowHttpError(updateMailAddressInputSchema, rawArgs);
    return context.entities.MailAddress.update({
        where: {
            id,
            user: {
                id: context.user.id,
            },
        },
        data,
    });
};
// Set default address operation
export const setDefaultAddress = async (rawArgs, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    const { id } = ensureArgsSchemaOrThrowHttpError(z.object({ id: z.string().nonempty() }), rawArgs);
    // First, unset any existing default addresses
    await context.entities.MailAddress.updateMany({
        where: {
            userId: context.user.id,
            isDefault: true,
        },
        data: {
            isDefault: false,
        },
    });
    // Then set the new default
    return context.entities.MailAddress.update({
        where: {
            id,
            user: {
                id: context.user.id,
            },
        },
        data: {
            isDefault: true,
        },
    });
};
