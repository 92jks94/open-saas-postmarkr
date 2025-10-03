/**
 * Test Data Factories
 * Factory functions for creating test data with realistic values
 */

import { faker } from '@faker-js/faker';
import type { User, MailAddress, MailPiece, File, MailPieceStatusHistory } from 'wasp/entities';

// User Factory
export const createUser = (overrides: Partial<User> = {}): User => ({
  id: faker.string.uuid(),
  createdAt: faker.date.past(),
  email: faker.internet.email(),
  username: faker.internet.userName(),
  isAdmin: false,
  hasBetaAccess: true,
  hasFullAccess: false,
  paymentProcessorUserId: null,
  subscriptionStatus: null,
  subscriptionPlan: null,
  datePaid: null,
  credits: 3,
  ...overrides,
});

// AuthUser Factory (for Wasp context)
export const createAuthUser = (overrides: any = {}) => ({
  id: faker.string.uuid(),
  identities: {
    email: {
      id: faker.string.uuid(),
      isEmailVerified: true,
      emailVerificationSentAt: null,
      passwordResetSentAt: null,
    },
  },
  ...overrides,
});

export const createAdminUser = (overrides: Partial<User> = {}): User => 
  createUser({ isAdmin: true, hasBetaAccess: true, ...overrides });

export const createBetaUser = (overrides: Partial<User> = {}): User => 
  createUser({ hasBetaAccess: true, ...overrides });

export const createFullAccessUser = (overrides: Partial<User> = {}): User => 
  createUser({ hasFullAccess: true, hasBetaAccess: true, ...overrides });

// MailAddress Factory
export const createMailAddress = (userId: string, overrides: Partial<MailAddress> = {}): MailAddress => ({
  id: faker.string.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  userId,
  contactName: faker.person.fullName(),
  companyName: faker.company.name(),
  address_line1: faker.location.streetAddress(),
  address_line2: faker.location.secondaryAddress(),
  address_city: faker.location.city(),
  address_state: faker.location.state({ abbreviated: true }),
  address_zip: faker.location.zipCode(),
  address_country: 'US',
  label: faker.lorem.word(),
  isDefault: false,
  addressType: 'both',
  isValidated: false,
  validationDate: null,
  validationError: null,
  lobAddressId: null,
  usageCount: 0,
  lastUsedAt: null,
  ...overrides,
});

export const createValidatedMailAddress = (userId: string, overrides: Partial<MailAddress> = {}): MailAddress => 
  createMailAddress(userId, {
    isValidated: true,
    validationDate: faker.date.recent(),
    lobAddressId: faker.string.alphanumeric(10),
    ...overrides,
  });

export const createDefaultMailAddress = (userId: string, overrides: Partial<MailAddress> = {}): MailAddress => 
  createMailAddress(userId, { isDefault: true, ...overrides });

// File Factory
export const createFile = (userId: string, overrides: Partial<File> = {}): File => ({
  id: faker.string.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  userId,
  name: faker.system.fileName(),
  type: 'application/pdf',
  key: faker.string.alphanumeric(20),
  uploadUrl: faker.internet.url(),
  size: faker.number.int({ min: 1000, max: 10000000 }),
  isMailFile: false,
  validationStatus: 'validated',
  validationError: null,
  pageCount: faker.number.int({ min: 1, max: 20 }),
  pdfMetadata: {
    title: faker.lorem.sentence(),
    author: faker.person.fullName(),
    creator: 'Test Creator',
    producer: 'Test Producer',
    creationDate: faker.date.past().toISOString(),
    modificationDate: faker.date.recent().toISOString(),
  },
  lastProcessedAt: faker.date.recent(),
  ...overrides,
});

export const createMailFile = (userId: string, overrides: Partial<File> = {}): File => 
  createFile(userId, { isMailFile: true, ...overrides });

export const createInvalidFile = (userId: string, overrides: Partial<File> = {}): File => 
  createFile(userId, {
    validationStatus: 'invalid',
    validationError: 'Invalid file format',
    ...overrides,
  });

// MailPiece Factory
export const createMailPiece = (
  userId: string,
  senderAddressId: string,
  recipientAddressId: string,
  overrides: Partial<MailPiece> = {}
): MailPiece => ({
  id: faker.string.uuid(),
  createdAt: faker.date.past(),
  updatedAt: faker.date.recent(),
  userId,
  mailType: 'letter',
  mailClass: 'first_class',
  mailSize: '6x9',
  senderAddressId,
  recipientAddressId,
  fileId: null,
  lobId: null,
  lobStatus: null,
  lobTrackingNumber: null,
  paymentIntentId: null,
  paymentStatus: 'pending',
  cost: faker.number.float({ min: 0.5, max: 5.0, precision: 0.01 }),
  status: 'draft',
  description: faker.lorem.sentence(),
  metadata: null,
  customerPrice: faker.number.float({ min: 1.0, max: 10.0, precision: 0.01 }),
  lobCost: faker.number.float({ min: 0.5, max: 5.0, precision: 0.01 }),
  markup: faker.number.float({ min: 0.1, max: 2.0, precision: 0.01 }),
  pageCount: faker.number.int({ min: 1, max: 20 }),
  pricingTier: 'tier_1',
  envelopeType: 'standard_10_double_window',
  returnReceipt: false,
  serviceOptions: null,
  signatureConfirmation: false,
  trackingEnabled: false,
  colorPrinting: false,
  doubleSided: true,
  addressPlacement: 'INSERT_BLANK_PAGE',
  lobThumbnails: null,
  lobPreviewUrl: null,
  ...overrides,
});

export const createDraftMailPiece = (
  userId: string,
  senderAddressId: string,
  recipientAddressId: string,
  overrides: Partial<MailPiece> = {}
): MailPiece => 
  createMailPiece(userId, senderAddressId, recipientAddressId, {
    status: 'draft',
    paymentStatus: 'pending',
    ...overrides,
  });

export const createPaidMailPiece = (
  userId: string,
  senderAddressId: string,
  recipientAddressId: string,
  overrides: Partial<MailPiece> = {}
): MailPiece => 
  createMailPiece(userId, senderAddressId, recipientAddressId, {
    status: 'pending_payment',
    paymentStatus: 'succeeded',
    paymentIntentId: faker.string.alphanumeric(20),
    ...overrides,
  });

export const createSubmittedMailPiece = (
  userId: string,
  senderAddressId: string,
  recipientAddressId: string,
  overrides: Partial<MailPiece> = {}
): MailPiece => 
  createMailPiece(userId, senderAddressId, recipientAddressId, {
    status: 'submitted',
    paymentStatus: 'succeeded',
    lobId: faker.string.alphanumeric(10),
    lobStatus: 'processing',
    ...overrides,
  });

export const createDeliveredMailPiece = (
  userId: string,
  senderAddressId: string,
  recipientAddressId: string,
  overrides: Partial<MailPiece> = {}
): MailPiece => 
  createMailPiece(userId, senderAddressId, recipientAddressId, {
    status: 'delivered',
    paymentStatus: 'succeeded',
    lobId: faker.string.alphanumeric(10),
    lobStatus: 'delivered',
    lobTrackingNumber: faker.string.alphanumeric(15),
    ...overrides,
  });

// MailPieceStatusHistory Factory
export const createMailPieceStatusHistory = (
  mailPieceId: string,
  overrides: Partial<MailPieceStatusHistory> = {}
): MailPieceStatusHistory => ({
  id: faker.string.uuid(),
  createdAt: faker.date.past(),
  mailPieceId,
  status: faker.helpers.arrayElement(['draft', 'pending_payment', 'submitted', 'in_transit', 'delivered', 'returned', 'failed']),
  previousStatus: null,
  description: faker.lorem.sentence(),
  source: 'system',
  lobData: null,
  ...overrides,
});

// Batch creation helpers
export const createUserWithAddresses = (addressCount: number = 2) => {
  const user = createUser();
  const addresses = Array.from({ length: addressCount }, (_, index) => 
    createMailAddress(user.id, { isDefault: index === 0 })
  );
  return { user, addresses };
};

export const createUserWithMailPieces = (mailPieceCount: number = 3) => {
  const user = createUser();
  const senderAddress = createDefaultMailAddress(user.id);
  const recipientAddress = createMailAddress(user.id);
  const mailPieces = Array.from({ length: mailPieceCount }, () => 
    createMailPiece(user.id, senderAddress.id, recipientAddress.id)
  );
  return { user, senderAddress, recipientAddress, mailPieces };
};

export const createCompleteMailWorkflow = () => {
  const user = createUser();
  const senderAddress = createValidatedMailAddress(user.id, { isDefault: true });
  const recipientAddress = createValidatedMailAddress(user.id);
  const file = createMailFile(user.id);
  const mailPiece = createDraftMailPiece(user.id, senderAddress.id, recipientAddress.id, {
    fileId: file.id,
    pageCount: file.pageCount,
  });
  const statusHistory = createMailPieceStatusHistory(mailPiece.id, {
    status: 'draft',
    source: 'user',
  });
  
  return {
    user,
    senderAddress,
    recipientAddress,
    file,
    mailPiece,
    statusHistory,
  };
};

// Test scenario builders
export const buildPaymentFailureScenario = () => {
  const workflow = createCompleteMailWorkflow();
  const failedMailPiece = createPaidMailPiece(
    workflow.user.id,
    workflow.senderAddress.id,
    workflow.recipientAddress.id,
    {
      fileId: workflow.file.id,
      paymentStatus: 'failed',
      status: 'failed',
    }
  );
  
  return {
    ...workflow,
    mailPiece: failedMailPiece,
  };
};

export const buildWebhookUpdateScenario = () => {
  const workflow = createCompleteMailWorkflow();
  const updatedMailPiece = createSubmittedMailPiece(
    workflow.user.id,
    workflow.senderAddress.id,
    workflow.recipientAddress.id,
    {
      fileId: workflow.file.id,
      lobId: faker.string.alphanumeric(10),
      lobStatus: 'in_transit',
      lobTrackingNumber: faker.string.alphanumeric(15),
    }
  );
  
  const statusUpdate = createMailPieceStatusHistory(updatedMailPiece.id, {
    status: 'in_transit',
    previousStatus: 'submitted',
    source: 'webhook',
    lobData: {
      id: updatedMailPiece.lobId,
      status: 'in_transit',
      tracking_number: updatedMailPiece.lobTrackingNumber,
    },
  });
  
  return {
    ...workflow,
    mailPiece: updatedMailPiece,
    statusUpdate,
  };
};