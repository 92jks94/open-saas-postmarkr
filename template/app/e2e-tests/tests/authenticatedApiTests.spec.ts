import { test, expect } from '@playwright/test';
import { createRandomUser, signUserUp, type User } from './utils';

let testUser: User;
let authToken: string;

test.describe('Authenticated API Tests', () => {
  test.beforeAll(async ({ request }) => {
    // Create test user
    testUser = createRandomUser();
    
    // Sign up user - Wasp uses operations, not direct auth endpoints
    const signupResponse = await request.post('/operations/signup', {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });
    expect(signupResponse.status()).toBe(200);
    
    // Login to get auth token - Wasp uses operations
    const loginResponse = await request.post('/operations/login', {
      data: {
        email: testUser.email,
        password: testUser.password
      }
    });
    expect(loginResponse.status()).toBe(200);
    
    const loginData = await loginResponse.json();
    // Wasp uses session-based auth, so we'll use cookies instead of tokens
    authToken = loginData.token || loginData.sessionId || 'session-based';
  });

  test('Get mail pieces returns user data', async ({ request }) => {
    const response = await request.get('/operations/getMailPieces');
    
    // Should return 200 with user's mail pieces (empty array for new user)
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('Create mail piece works with valid data', async ({ request }) => {
    const mailData = {
      description: 'Test mail piece',
      recipientName: 'Test Recipient',
      recipientAddress: '123 Test St',
      recipientCity: 'Test City',
      recipientState: 'TS',
      recipientZip: '12345',
      recipientCountry: 'US'
    };
    
    const response = await request.post('/operations/createMailPiece', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: mailData
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('id');
    expect(data.description).toBe(mailData.description);
  });

  test('Get mail addresses returns user data', async ({ request }) => {
    const response = await request.get('/operations/getMailAddressesByUser');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('Get all files by user returns user data', async ({ request }) => {
    const response = await request.get('/operations/getAllFilesByUser');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('Generate checkout session works with valid plan', async ({ request }) => {
    const response = await request.post('/operations/generateCheckoutSession', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        planId: 'hobby'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('sessionUrl');
    expect(data.sessionUrl).toContain('stripe.com');
  });

  test('Get customer portal URL works for authenticated user', async ({ request }) => {
    const response = await request.get('/operations/getCustomerPortalUrl');
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    // Should return null for new user without subscription
    expect(data).toBeNull();
  });

  test('Generate GPT response works with valid input', async ({ request }) => {
    const response = await request.post('/operations/generateGptResponse', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        hours: 8
      }
    });
    
    // Should return 200 with generated schedule
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('schedule');
    expect(Array.isArray(data.schedule)).toBe(true);
  });

  test('Create file operation works with valid data', async ({ request }) => {
    const response = await request.post('/operations/createFile', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        fileType: 'application/pdf',
        fileName: 'test-document.pdf'
      }
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('s3UploadUrl');
    expect(data).toHaveProperty('s3UploadFields');
    expect(data.s3UploadUrl).toContain('amazonaws.com');
  });

  test('Address validation works with valid address', async ({ request }) => {
    const addressData = {
      address_line1: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip_code: '12345',
      country: 'US'
    };
    
    const response = await request.post('/api/validate-address', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: addressData
    });
    
    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty('valid');
    expect(typeof data.valid).toBe('boolean');
  });
});

test.describe('API Error Handling', () => {
  test('Invalid mail piece data returns validation error', async ({ request }) => {
    const response = await request.post('/operations/createMailPiece', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        invalid: 'data'
      }
    });
    
    // Should return 400 (bad request) for invalid data
    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  test('Invalid address data returns validation error', async ({ request }) => {
    const response = await request.post('/api/validate-address', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        invalid: 'address'
      }
    });
    
    // Should return 400 (bad request) for invalid data
    expect(response.status()).toBe(400);
  });

  test('Invalid file type returns validation error', async ({ request }) => {
    const response = await request.post('/operations/createFile', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        fileType: 'invalid/type',
        fileName: 'test.txt'
      }
    });
    
    // Should return 400 (bad request) for invalid file type
    expect(response.status()).toBe(400);
  });

  test('Invalid payment plan returns validation error', async ({ request }) => {
    const response = await request.post('/operations/generateCheckoutSession', {
      headers: {
        'Content-Type': 'application/json'
      },
      data: {
        planId: 'invalid-plan'
      }
    });
    
    // Should return 400 (bad request) for invalid plan
    expect(response.status()).toBe(400);
  });
});

test.describe('API Security Tests', () => {
  test('Operations require authentication', async ({ request }) => {
    // Test without authentication
    const response = await request.get('/operations/getMailPieces');
    
    // Should return 401 (unauthorized)
    expect(response.status()).toBe(401);
  });

  test('Admin operations require admin privileges', async ({ request }) => {
    // Test admin operation with regular user
    const response = await request.get('/operations/getPaginatedUsers', {
      params: {
        skipPages: 0,
        filter: JSON.stringify({
          subscriptionStatusIn: [],
          emailContains: '',
          isAdmin: false
        })
      }
    });
    
    // Should return 403 (forbidden) for non-admin user
    expect(response.status()).toBe(403);
  });
});
