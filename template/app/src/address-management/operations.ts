// ============================================================================
// WASP FRAMEWORK IMPORTS
// ============================================================================
import { HttpError } from 'wasp/server';
import type {
  CreateMailAddress,
  DeleteMailAddress,
  GetMailAddressesByUser,
  UpdateMailAddress,
  ValidateAddress,
} from 'wasp/server/operations';
import type { MailAddress } from 'wasp/entities';

// ============================================================================
// LOCAL SERVICE/UTILITY IMPORTS
// ============================================================================
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

// ============================================================================
// EXTERNAL LIBRARY IMPORTS
// ============================================================================
import * as z from 'zod';

// Copy the exact validation pattern from file-upload
const createMailAddressInputSchema = z.object({
  contactName: z.string().nonempty(),
  companyName: z.string().optional(),
  address_line1: z.string().nonempty(),
  address_line2: z.string().optional(),
  address_city: z.string().nonempty(),
  address_state: z.string().nonempty(),
  address_zip: z.string().nonempty(),
  address_country: z.string().nonempty(),
  label: z.string().optional(),
  addressType: z.enum(['sender', 'recipient', 'both']).default('both'),
});

type CreateMailAddressInput = z.infer<typeof createMailAddressInputSchema>;

export const createMailAddress: CreateMailAddress<CreateMailAddressInput, MailAddress> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const data = ensureArgsSchemaOrThrowHttpError(createMailAddressInputSchema, rawArgs);

  // Create the address first
  const address = await context.entities.MailAddress.create({
    data: {
      ...data,
      user: { connect: { id: context.user.id } },
    },
  });

  // Automatically trigger address verification after creation
  try {
    console.log('🔄 Starting address verification for creation...');
    console.log('📍 Address data:', {
      address_line1: address.address_line1,
      address_line2: address.address_line2 || undefined,
      address_city: address.address_city,
      address_state: address.address_state,
      address_zip: address.address_zip,
      address_country: address.address_country,
    });
    
    // Import the validation service
    const { validateAddress: validateAddressService } = await import('../server/lob/services');
    
    // Call the Lob validation service with correct field names
    const validationResult = await validateAddressService({
      contactName: address.contactName,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || undefined,
      address_city: address.address_city,
      address_state: address.address_state,
      address_zip: address.address_zip,
      address_country: address.address_country,
    });
    
    console.log('🔍 Validation result:', validationResult);

    // Update the address with validation results
    const finalAddress = await context.entities.MailAddress.update({
      where: { id: address.id },
      data: {
        isValidated: validationResult.isValid,
        validationDate: new Date(),
        validationError: validationResult.error,
        lobAddressId: validationResult.verifiedAddress?.id as string | null | undefined,
      },
    });

    return finalAddress;
  } catch (validationError) {
    console.error('Address validation failed after creation:', validationError);
    
    // Update with validation error but don't fail the entire operation
    const finalAddress = await context.entities.MailAddress.update({
      where: { id: address.id },
      data: {
        isValidated: false,
        validationDate: new Date(),
        validationError: validationError instanceof Error ? validationError.message : 'Validation failed',
      },
    });

    return finalAddress;
  }
};

// Copy getAllFilesByUser pattern exactly
export const getMailAddressesByUser: GetMailAddressesByUser<void, MailAddress[]> = async (_args, context) => {
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
export const deleteMailAddress: DeleteMailAddress<{id: string}, MailAddress> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { id } = ensureArgsSchemaOrThrowHttpError(z.object({id: z.string().nonempty()}), rawArgs);

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
    address_line1: z.string().optional(),
    address_line2: z.string().optional(),
    address_city: z.string().optional(),
    address_state: z.string().optional(),
    address_zip: z.string().optional(),
    address_country: z.string().optional(),
    label: z.string().optional(),
    addressType: z.enum(['sender', 'recipient', 'both']).optional(),
  }),
});

type UpdateMailAddressInput = z.infer<typeof updateMailAddressInputSchema>;

export const updateMailAddress: UpdateMailAddress<UpdateMailAddressInput, MailAddress> = async (rawArgs, context) => {
  console.log('🔄 updateMailAddress operation called with:', rawArgs);
  
  if (!context.user) {
    throw new HttpError(401);
  }

  const { id, data } = ensureArgsSchemaOrThrowHttpError(updateMailAddressInputSchema, rawArgs);
  console.log('📋 Parsed update data:', { id, data });

  // Update the address first
  const updatedAddress = await context.entities.MailAddress.update({
    where: {
      id,
      user: {
        id: context.user.id,
      },
    },
    data,
  });

  // Automatically trigger address verification after update
  try {
    console.log('🔄 Starting address verification for update...');
    console.log('📍 Address data:', {
      address_line1: updatedAddress.address_line1,
      address_line2: updatedAddress.address_line2 === null ? undefined : updatedAddress.address_line2,
      address_city: updatedAddress.address_city,
      address_state: updatedAddress.address_state,
      address_zip: updatedAddress.address_zip,
      address_country: updatedAddress.address_country,
    });
    
    // Import the validation service
    const { validateAddress: validateAddressService } = await import('../server/lob/services');
    
    // Call the Lob validation service with correct field names
    const validationResult = await validateAddressService({
      contactName: updatedAddress.contactName,
      address_line1: updatedAddress.address_line1,
      address_line2: updatedAddress.address_line2 || undefined,
      address_city: updatedAddress.address_city,
      address_state: updatedAddress.address_state,
      address_zip: updatedAddress.address_zip,
      address_country: updatedAddress.address_country,
    });
    
    console.log('🔍 Validation result:', validationResult);

    // Update the address with validation results
    const finalAddress = await context.entities.MailAddress.update({
      where: { id },
      data: {
        isValidated: validationResult.isValid,
        validationDate: new Date(),
        validationError: validationResult.error,
        lobAddressId: validationResult.verifiedAddress?.id as string | null | undefined,
      },
    });

    return finalAddress;
  } catch (validationError) {
    console.error('Address validation failed after update:', validationError);
    
    // Update with validation error but don't fail the entire operation
    const finalAddress = await context.entities.MailAddress.update({
      where: { id },
      data: {
        isValidated: false,
        validationDate: new Date(),
        validationError: validationError instanceof Error ? validationError.message : 'Validation failed',
      },
    });

    return finalAddress;
  }
};

// Set default address operation
export const setDefaultAddress: UpdateMailAddress<{id: string}, MailAddress> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { id } = ensureArgsSchemaOrThrowHttpError(z.object({id: z.string().nonempty()}), rawArgs);

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

// Validate address operation
const validateAddressInputSchema = z.object({
  addressId: z.string().nonempty(),
});

type ValidateAddressInput = z.infer<typeof validateAddressInputSchema>;

export const validateAddress: ValidateAddress<ValidateAddressInput, { address: MailAddress; isValid: boolean; error: string | null; lobAddressId?: string }> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { addressId } = ensureArgsSchemaOrThrowHttpError(validateAddressInputSchema, rawArgs);

  // Get the address from database
  const address = await context.entities.MailAddress.findFirst({
    where: {
      id: addressId,
      userId: context.user.id,
    },
  });

  if (!address) {
    throw new HttpError(404, 'Address not found');
  }

  try {
    // Import the validation service
    const { validateAddress: validateAddressService } = await import('../server/lob/services');
    
    // Call the Lob validation service with correct field names
    const validationResult = await validateAddressService({
      contactName: address.contactName,
      address_line1: address.address_line1,
      address_line2: address.address_line2 || undefined,
      address_city: address.address_city,
      address_state: address.address_state,
      address_zip: address.address_zip,
      address_country: address.address_country,
    });

    // Update the address with validation results
    const updatedAddress = await context.entities.MailAddress.update({
      where: { id: addressId },
      data: {
        isValidated: validationResult.isValid,
        validationDate: new Date(),
        validationError: validationResult.error,
        lobAddressId: validationResult.verifiedAddress?.id as string | null | undefined,
      },
    });

    return {
      address: updatedAddress,
      isValid: validationResult.isValid,
      error: validationResult.error,
      lobAddressId: validationResult.verifiedAddress?.id as string | undefined,
    };
  } catch (error) {
    console.error('Address validation error:', error);
    
    // Update address with validation failure
    await context.entities.MailAddress.update({
      where: { id: addressId },
      data: {
        isValidated: false,
        validationDate: new Date(),
        validationError: 'Validation service unavailable',
      },
    });

    throw new HttpError(500, 'Failed to validate address');
  }
};