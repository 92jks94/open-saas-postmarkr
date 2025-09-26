/**
 * Test Mocks and Utilities
 * Comprehensive mocking utilities for external services and dependencies
 */

import { vi } from 'vitest';
import type { User, MailAddress, MailPiece, File, MailPieceStatusHistory } from 'wasp/entities';

// Mock Stripe
export const mockStripe = {
  paymentIntents: {
    create: vi.fn(),
    retrieve: vi.fn(),
    confirm: vi.fn(),
    cancel: vi.fn(),
    refund: vi.fn(),
  },
  customers: {
    create: vi.fn(),
    retrieve: vi.fn(),
    update: vi.fn(),
  },
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
  webhooks: {
    constructEvent: vi.fn(),
  },
};

// Mock Lob API
export const mockLob = {
  addresses: {
    create: vi.fn(),
    verify: vi.fn(),
  },
  postcards: {
    create: vi.fn(),
  },
  letters: {
    create: vi.fn(),
  },
  checks: {
    create: vi.fn(),
  },
};

// Mock AWS S3
export const mockS3 = {
  getSignedUrl: vi.fn(),
  upload: vi.fn(),
  deleteObject: vi.fn(),
  getObject: vi.fn(),
};

// Mock SendGrid
export const mockSendGrid = {
  send: vi.fn(),
};

// Mock Prisma Client
export const createMockPrismaClient = () => ({
  user: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  mailAddress: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  mailPiece: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  file: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  mailPieceStatusHistory: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    upsert: vi.fn(),
  },
  $transaction: vi.fn(),
  $connect: vi.fn(),
  $disconnect: vi.fn(),
});

// Mock Wasp Context
export const createMockWaspContext = (user?: User) => ({
  user: user || {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    isAdmin: false,
    hasBetaAccess: true,
    hasFullAccess: false,
    createdAt: new Date(),
  },
  entities: {
    User: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    MailAddress: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    MailPiece: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    File: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    MailPieceStatusHistory: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
});

// Mock HTTP Error
export const mockHttpError = (status: number, message: string) => {
  const error = new Error(message);
  (error as any).status = status;
  return error;
};

// Mock successful responses
export const mockSuccessResponses = {
  stripe: {
    paymentIntent: {
      id: 'pi_test_123',
      client_secret: 'pi_test_123_secret',
      amount: 500,
      currency: 'usd',
      status: 'requires_payment_method',
    },
    customer: {
      id: 'cus_test_123',
      email: 'test@example.com',
    },
    checkoutSession: {
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test',
    },
  },
  lob: {
    address: {
      id: 'addr_test_123',
      verified: true,
      deliverable: true,
    },
    postcard: {
      id: 'psc_test_123',
      status: 'created',
      price: '0.50',
    },
    letter: {
      id: 'ltr_test_123',
      status: 'created',
      price: '0.55',
    },
  },
  s3: {
    uploadUrl: 'https://test-bucket.s3.amazonaws.com/test-key',
    uploadFields: {
      'Content-Type': 'application/pdf',
      'key': 'test-key',
    },
  },
  sendgrid: {
    messageId: 'test-message-id',
  },
};

// Mock error responses
export const mockErrorResponses = {
  stripe: {
    invalidRequestError: {
      type: 'invalid_request_error',
      message: 'Invalid request',
    },
    cardError: {
      type: 'card_error',
      message: 'Your card was declined',
    },
  },
  lob: {
    invalidRequestError: {
      error: {
        message: 'Invalid request',
        status_code: 400,
      },
    },
  },
  s3: {
    accessDenied: {
      error: 'Access Denied',
    },
  },
};

// Setup mocks for external services
export const setupServiceMocks = () => {
  // Mock Stripe
  vi.mock('stripe', () => ({
    default: vi.fn(() => mockStripe),
  }));

  // Mock Lob
  vi.mock('lob', () => ({
    default: vi.fn(() => mockLob),
  }));

  // Mock AWS SDK
  vi.mock('@aws-sdk/client-s3', () => ({
    S3Client: vi.fn(() => mockS3),
    GetObjectCommand: vi.fn(),
    PutObjectCommand: vi.fn(),
    DeleteObjectCommand: vi.fn(),
  }));

  vi.mock('@aws-sdk/s3-presigned-post', () => ({
    createPresignedPost: vi.fn(),
  }));

  vi.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: vi.fn(),
  }));

  // Mock SendGrid
  vi.mock('@sendgrid/mail', () => ({
    setApiKey: vi.fn(),
    send: vi.fn(),
  }));

  // Mock PDF processing
  vi.mock('pdf-lib', () => ({
    PDFDocument: {
      load: vi.fn(),
    },
  }));
};

// Reset all mocks
export const resetAllMocks = () => {
  vi.clearAllMocks();
  
  // Reset Stripe mocks
  Object.values(mockStripe.paymentIntents).forEach(mock => mock.mockReset());
  Object.values(mockStripe.customers).forEach(mock => mock.mockReset());
  Object.values(mockStripe.checkout.sessions).forEach(mock => mock.mockReset());
  
  // Reset Lob mocks
  Object.values(mockLob.addresses).forEach(mock => mock.mockReset());
  Object.values(mockLob.postcards).forEach(mock => mock.mockReset());
  Object.values(mockLob.letters).forEach(mock => mock.mockReset());
  
  // Reset S3 mocks
  Object.values(mockS3).forEach(mock => mock.mockReset());
  
  // Reset SendGrid mocks
  Object.values(mockSendGrid).forEach(mock => mock.mockReset());
};

// Helper to mock successful service calls
export const mockSuccessfulServiceCalls = () => {
  // Mock successful Stripe calls
  mockStripe.paymentIntents.create.mockResolvedValue(mockSuccessResponses.stripe.paymentIntent);
  mockStripe.customers.create.mockResolvedValue(mockSuccessResponses.stripe.customer);
  mockStripe.checkout.sessions.create.mockResolvedValue(mockSuccessResponses.stripe.checkoutSession);
  
  // Mock successful Lob calls
  mockLob.addresses.create.mockResolvedValue(mockSuccessResponses.lob.address);
  mockLob.postcards.create.mockResolvedValue(mockSuccessResponses.lob.postcard);
  mockLob.letters.create.mockResolvedValue(mockSuccessResponses.lob.letter);
  
  // Mock successful S3 calls
  mockS3.getSignedUrl.mockResolvedValue(mockSuccessResponses.s3.uploadUrl);
  
  // Mock successful SendGrid calls
  mockSendGrid.send.mockResolvedValue([{ statusCode: 202 }, {}]);
};

// Helper to mock failed service calls
export const mockFailedServiceCalls = () => {
  // Mock failed Stripe calls
  mockStripe.paymentIntents.create.mockRejectedValue(mockErrorResponses.stripe.invalidRequestError);
  mockStripe.customers.create.mockRejectedValue(mockErrorResponses.stripe.invalidRequestError);
  
  // Mock failed Lob calls
  mockLob.addresses.create.mockRejectedValue(mockErrorResponses.lob.invalidRequestError);
  mockLob.postcards.create.mockRejectedValue(mockErrorResponses.lob.invalidRequestError);
  
  // Mock failed S3 calls
  mockS3.getSignedUrl.mockRejectedValue(mockErrorResponses.s3.accessDenied);
  
  // Mock failed SendGrid calls
  mockSendGrid.send.mockRejectedValue(new Error('SendGrid API Error'));
};