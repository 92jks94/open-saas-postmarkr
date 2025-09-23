import { lob } from './client';
import { HttpError } from 'wasp/server';

/**
 * Validate an address using Lob API
 */
export async function validateAddress(addressData: {
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}) {
  try {
    const verification = await lob.usVerifications.verify({
      address_line1: addressData.address_line1,
      address_line2: addressData.address_line2,
      city: addressData.city,
      state: addressData.state,
      zip_code: addressData.zip_code,
      country: addressData.country,
    });

    return {
      isValid: verification.deliverability === 'deliverable',
      verifiedAddress: verification.address,
      error: verification.deliverability === 'undeliverable' ? 'Address is not deliverable' : null,
    };
  } catch (error) {
    console.error('Lob address validation error:', error);
    throw new HttpError(500, 'Failed to validate address');
  }
}

/**
 * Calculate cost for mail specifications using Lob API
 */
export async function calculateCost(mailSpecs: {
  mailType: string;
  mailClass: string;
  mailSize: string;
  toAddress: any;
  fromAddress: any;
}) {
  try {
    // For now, return mock pricing data
    // TODO: Implement actual Lob pricing API integration
    const baseCosts = {
      'postcard': 0.50,
      'letter': 0.60,
      'check': 0.60,
      'self_mailer': 0.60,
      'catalog': 0.60,
      'booklet': 0.60,
    };

    const classMultipliers = {
      'usps_first_class': 1.0,
      'usps_standard': 0.8,
      'usps_express': 2.0,
      'usps_priority': 1.5,
    };

    const baseCost = baseCosts[mailSpecs.mailType as keyof typeof baseCosts] || 0.60;
    const multiplier = classMultipliers[mailSpecs.mailClass as keyof typeof classMultipliers] || 1.0;
    const cost = baseCost * multiplier;

    return {
      cost: Math.round(cost * 100), // Convert to cents
      currency: 'USD',
      breakdown: {
        baseCost,
        multiplier,
        mailType: mailSpecs.mailType,
        mailClass: mailSpecs.mailClass,
        mailSize: mailSpecs.mailSize,
      },
    };
  } catch (error) {
    console.error('Lob cost calculation error:', error);
    throw new HttpError(500, 'Failed to calculate mail cost');
  }
}

/**
 * Create a mail piece using Lob API
 */
export async function createMailPiece(mailData: {
  to: any;
  from: any;
  mailType: string;
  mailClass: string;
  mailSize: string;
  fileUrl?: string;
  description?: string;
}) {
  try {
    // For now, return mock response
    // TODO: Implement actual Lob mail creation
    const mockLobId = `lob_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: mockLobId,
      status: 'submitted',
      trackingNumber: `TRK${Date.now()}`,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      cost: 60, // 60 cents
    };
  } catch (error) {
    console.error('Lob mail creation error:', error);
    throw new HttpError(500, 'Failed to create mail piece');
  }
}

/**
 * Get mail piece status from Lob API
 */
export async function getMailPieceStatus(lobId: string) {
  try {
    // For now, return mock status
    // TODO: Implement actual Lob status retrieval
    const statuses = ['submitted', 'in_transit', 'delivered', 'returned'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: lobId,
      status: randomStatus,
      trackingNumber: `TRK${lobId.split('_')[1]}`,
      estimatedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      events: [
        {
          timestamp: new Date(),
          status: randomStatus,
          description: `Mail piece ${randomStatus}`,
        },
      ],
    };
  } catch (error) {
    console.error('Lob status retrieval error:', error);
    throw new HttpError(500, 'Failed to retrieve mail piece status');
  }
}
