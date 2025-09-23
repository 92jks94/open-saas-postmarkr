import { HttpError } from 'wasp/server';
import { validateAddress } from './services';

/**
 * API endpoint for address validation
 * This would be called from the client-side AddressSelector component
 */
export async function validateAddressEndpoint(req: any, res: any, context: any) {
  try {
    const { address_line1, address_line2, city, state, zip_code, country } = req.body;

    if (!address_line1 || !city || !state || !zip_code || !country) {
      throw new HttpError(400, 'Missing required address fields');
    }

    const result = await validateAddress({
      address_line1,
      address_line2,
      city,
      state,
      zip_code,
      country,
    });

    res.json({
      isValid: result.isValid,
      error: result.error,
      lobAddressId: result.verifiedAddress?.id,
      verifiedAddress: result.verifiedAddress,
    });
  } catch (error) {
    console.error('Address validation error:', error);
    
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
