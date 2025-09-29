/**
 * Test Setup Configuration
 * This file sets up the testing environment for all tests
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';
process.env.WASP_WEB_CLIENT_URL = 'http://localhost:3000';
process.env.WASP_SERVER_URL = 'http://localhost:3001';

// Mock external service environment variables
process.env.STRIPE_SECRET_KEY = 'sk_test_123456789';
process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123456789';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123456789';
process.env.SENDGRID_API_KEY = 'SG.test-key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
process.env.SENDGRID_FROM_NAME = 'Test App';
process.env.LOB_PROD_KEY = 'test_lob_key';
process.env.LOB_ENVIRONMENT = 'test';
process.env.LOB_WEBHOOK_SECRET = 'test-webhook-secret';
process.env.AWS_S3_REGION = 'us-east-1';
process.env.AWS_S3_IAM_ACCESS_KEY = 'test-aws-key';
process.env.AWS_S3_IAM_SECRET_KEY = 'test-aws-secret';
process.env.AWS_S3_FILES_BUCKET = 'test-bucket';
process.env.SENTRY_DSN = 'https://test@sentry.io/test';
process.env.SENTRY_RELEASE = 'test-release';
process.env.SENTRY_SERVER_NAME = 'test-server';

// Global test setup
beforeAll(async () => {
  // Set up any global test configuration
  console.log('🧪 Setting up test environment...');
  
  // Mock console methods to reduce noise in tests
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(async () => {
  // Clean up any global test resources
  console.log('🧹 Cleaning up test environment...');
  
  // Restore console methods
  vi.restoreAllMocks();
});

beforeEach(() => {
  // Reset mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllTimers();
});

// Global test utilities
export const testUtils = {
  // Generate test data
  createTestUser: () => ({
    id: faker.string.uuid(),
    email: faker.internet.email(),
    username: faker.internet.userName(),
    isAdmin: false,
    hasBetaAccess: true,
    hasFullAccess: false,
    createdAt: new Date(),
  }),
  
  createTestMailAddress: (userId: string) => ({
    id: faker.string.uuid(),
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
    createdAt: new Date(),
  }),
  
  createTestFile: (userId: string) => ({
    id: faker.string.uuid(),
    userId,
    name: faker.system.fileName(),
    type: 'application/pdf',
    key: faker.string.alphanumeric(20),
    uploadUrl: faker.internet.url(),
    size: faker.number.int({ min: 1000, max: 10000000 }),
    isMailFile: false,
    validationStatus: 'validated',
    pageCount: faker.number.int({ min: 1, max: 20 }),
    createdAt: new Date(),
  }),
  
  createTestMailPiece: (userId: string, senderAddressId: string, recipientAddressId: string) => ({
    id: faker.string.uuid(),
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
    createdAt: new Date(),
  }),
  
  // Mock context for operations
  createMockContext: (user?: any) => ({
    user: user || testUtils.createTestUser(),
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
  }),
  
  // Wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate random UUID
  randomUUID: () => faker.string.uuid(),
  
  // Generate random email
  randomEmail: () => faker.internet.email(),
  
  // Generate random string
  randomString: (length: number = 10) => faker.string.alphanumeric(length),
};

// Export faker for use in tests
export { faker };