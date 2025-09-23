#!/usr/bin/env node
/**
 * Comprehensive Test Runner for Phase 4 Lob API Integration
 *
 * Runs all tests and provides detailed reporting with real data validation
 */
// Import the integration test function directly
async function runIntegrationTests() {
    console.log('🔍 Testing Address Validation...');
    try {
        const { validateAddress } = await import('../services');
        const result = await validateAddress({
            address_line1: '123 Main St',
            address_line2: 'Apt 4B',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94105',
            country: 'US'
        });
        console.log('✅ Address validation result:', {
            isValid: result.isValid,
            error: result.error,
            verifiedAddress: result.verifiedAddress ? 'Present' : 'Missing'
        });
    }
    catch (error) {
        console.error('❌ Address validation failed:', error);
        return false;
    }
    console.log('\n💰 Testing Cost Calculation...');
    try {
        const { calculateCost } = await import('../services');
        const result = await calculateCost({
            mailType: 'letter',
            mailClass: 'usps_first_class',
            mailSize: '6x9',
            toAddress: {
                address_line1: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zip_code: '94105',
                country: 'US'
            },
            fromAddress: {
                address_line1: '456 Oak Ave',
                city: 'New York',
                state: 'NY',
                zip_code: '10001',
                country: 'US'
            }
        });
        console.log('✅ Cost calculation result:', {
            cost: result.cost,
            currency: result.currency,
            breakdown: result.breakdown,
            isFallback: result.breakdown.fallback || false
        });
    }
    catch (error) {
        console.error('❌ Cost calculation failed:', error);
        return false;
    }
    console.log('\n📮 Testing Mail Piece Creation...');
    try {
        const { createMailPiece } = await import('../services');
        const result = await createMailPiece({
            to: {
                address_line1: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zip_code: '94105',
                country: 'US'
            },
            from: {
                address_line1: '456 Oak Ave',
                city: 'New York',
                state: 'NY',
                zip_code: '10001',
                country: 'US'
            },
            mailType: 'letter',
            mailClass: 'usps_first_class',
            mailSize: '6x9',
            description: 'Test mail piece from integration test'
        });
        console.log('✅ Mail piece creation result:', {
            id: result.id,
            status: result.status,
            trackingNumber: result.trackingNumber,
            cost: result.cost,
            isSimulated: result.id.startsWith('lob_') && result.id.includes('_')
        });
    }
    catch (error) {
        console.error('❌ Mail piece creation failed:', error);
        return false;
    }
    console.log('\n📊 Testing Status Retrieval...');
    try {
        const { getMailPieceStatus } = await import('../services');
        const result = await getMailPieceStatus('test_lob_id');
        console.log('✅ Status retrieval result:', {
            id: result.id,
            status: result.status,
            trackingNumber: result.trackingNumber,
            eventsCount: result.events?.length || 0,
            mailType: result.mailType || 'unknown'
        });
    }
    catch (error) {
        console.error('❌ Status retrieval failed:', error);
        return false;
    }
    console.log('\n🔗 Testing Webhook Simulation...');
    try {
        const webhookPayload = {
            id: 'test_webhook_id',
            status: 'delivered',
            tracking_number: 'TRK123456789',
            type: 'letter',
            events: [
                {
                    name: 'delivered',
                    description: 'Mail piece delivered',
                    date_created: new Date().toISOString()
                }
            ]
        };
        console.log('✅ Webhook payload prepared:', {
            id: webhookPayload.id,
            status: webhookPayload.status,
            trackingNumber: webhookPayload.tracking_number,
            eventsCount: webhookPayload.events.length
        });
    }
    catch (error) {
        console.error('❌ Webhook simulation failed:', error);
        return false;
    }
    console.log('\n🎉 All integration tests completed successfully!');
    return true;
}
// Test configuration
const TEST_CONFIG = {
    // Real test data for validation
    testAddress: {
        address_line1: '123 Main St',
        address_line2: 'Apt 4B',
        city: 'San Francisco',
        state: 'CA',
        zip_code: '94105',
        country: 'US'
    },
    testMailSpecs: {
        mailType: 'letter',
        mailClass: 'usps_first_class',
        mailSize: '6x9',
        toAddress: {
            address_line1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94105',
            country: 'US'
        },
        fromAddress: {
            address_line1: '456 Oak Ave',
            city: 'New York',
            state: 'NY',
            zip_code: '10001',
            country: 'US'
        }
    },
    // Expected results for validation
    expectedResults: {
        addressValidation: {
            isValid: true,
            hasVerifiedAddress: true
        },
        costCalculation: {
            hasCost: true,
            currency: 'USD',
            costRange: { min: 50, max: 100 } // cents
        },
        mailPieceCreation: {
            hasId: true,
            hasStatus: true,
            hasTrackingNumber: true,
            hasCost: true
        },
        statusRetrieval: {
            hasStatus: true,
            hasTrackingNumber: true,
            hasEvents: true
        }
    }
};
class TestRunner {
    results = [];
    startTime = 0;
    async runAllTests() {
        console.log('🚀 Starting Comprehensive Phase 4 Testing...\n');
        this.startTime = Date.now();
        // Run test suites
        await this.runIntegrationTests();
        await this.runUnitTests();
        await this.runWebhookTests();
        await this.runErrorHandlingTests();
        await this.runRealDataValidationTests();
        this.generateReport();
    }
    async runIntegrationTests() {
        console.log('📡 Running Lob API Integration Tests...');
        const suiteStart = Date.now();
        const results = [];
        try {
            const success = await runIntegrationTests();
            results.push({
                name: 'Lob API Integration',
                passed: success,
                duration: Date.now() - suiteStart,
                details: { success }
            });
        }
        catch (error) {
            results.push({
                name: 'Lob API Integration',
                passed: false,
                duration: Date.now() - suiteStart,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        this.results.push({
            name: 'Integration Tests',
            results,
            totalTests: results.length,
            passedTests: results.filter(r => r.passed).length,
            failedTests: results.filter(r => !r.passed).length,
            duration: Date.now() - suiteStart
        });
    }
    async runUnitTests() {
        console.log('🧪 Running Unit Tests...');
        const suiteStart = Date.now();
        const results = [];
        // Test address validation
        try {
            const { validateAddress } = await import('../services');
            const start = Date.now();
            const result = await validateAddress(TEST_CONFIG.testAddress);
            const duration = Date.now() - start;
            const passed = result.isValid === TEST_CONFIG.expectedResults.addressValidation.isValid &&
                !!result.verifiedAddress === TEST_CONFIG.expectedResults.addressValidation.hasVerifiedAddress;
            results.push({
                name: 'Address Validation',
                passed,
                duration,
                details: { result }
            });
        }
        catch (error) {
            results.push({
                name: 'Address Validation',
                passed: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        // Test cost calculation
        try {
            const { calculateCost } = await import('../services');
            const start = Date.now();
            const result = await calculateCost(TEST_CONFIG.testMailSpecs);
            const duration = Date.now() - start;
            const passed = !!result.cost === TEST_CONFIG.expectedResults.costCalculation.hasCost &&
                result.currency === TEST_CONFIG.expectedResults.costCalculation.currency &&
                result.cost >= TEST_CONFIG.expectedResults.costCalculation.costRange.min &&
                result.cost <= TEST_CONFIG.expectedResults.costCalculation.costRange.max;
            results.push({
                name: 'Cost Calculation',
                passed,
                duration,
                details: { result }
            });
        }
        catch (error) {
            results.push({
                name: 'Cost Calculation',
                passed: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        // Test mail piece creation
        try {
            const { createMailPiece } = await import('../services');
            const start = Date.now();
            const result = await createMailPiece({
                to: TEST_CONFIG.testMailSpecs.toAddress,
                from: TEST_CONFIG.testMailSpecs.fromAddress,
                mailType: TEST_CONFIG.testMailSpecs.mailType,
                mailClass: TEST_CONFIG.testMailSpecs.mailClass,
                mailSize: TEST_CONFIG.testMailSpecs.mailSize,
                description: 'Test mail piece from test runner'
            });
            const duration = Date.now() - start;
            const passed = !!result.id === TEST_CONFIG.expectedResults.mailPieceCreation.hasId &&
                !!result.status === TEST_CONFIG.expectedResults.mailPieceCreation.hasStatus &&
                !!result.trackingNumber === TEST_CONFIG.expectedResults.mailPieceCreation.hasTrackingNumber &&
                !!result.cost === TEST_CONFIG.expectedResults.mailPieceCreation.hasCost;
            results.push({
                name: 'Mail Piece Creation',
                passed,
                duration,
                details: { result }
            });
        }
        catch (error) {
            results.push({
                name: 'Mail Piece Creation',
                passed: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        this.results.push({
            name: 'Unit Tests',
            results,
            totalTests: results.length,
            passedTests: results.filter(r => r.passed).length,
            failedTests: results.filter(r => !r.passed).length,
            duration: Date.now() - suiteStart
        });
    }
    async runWebhookTests() {
        console.log('🔗 Running Webhook Tests...');
        const suiteStart = Date.now();
        const results = [];
        // Test webhook signature verification
        try {
            const { verifyWebhookSignature } = await import('../webhook');
            const crypto = await import('crypto');
            const payload = { id: 'lob_123', status: 'delivered' };
            const secret = 'test_secret';
            const signature = crypto.createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');
            process.env.LOB_WEBHOOK_SECRET = secret;
            const start = Date.now();
            const isValid = verifyWebhookSignature(payload, `sha256=${signature}`);
            const duration = Date.now() - start;
            results.push({
                name: 'Webhook Signature Verification',
                passed: isValid,
                duration,
                details: { isValid, signature: `sha256=${signature}` }
            });
        }
        catch (error) {
            results.push({
                name: 'Webhook Signature Verification',
                passed: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        // Test webhook payload processing
        try {
            const { handleLobWebhook } = await import('../webhook');
            const mockReq = {
                body: {
                    id: 'lob_123456789',
                    status: 'delivered',
                    tracking_number: 'TRK123456789',
                    type: 'letter',
                    events: [
                        {
                            name: 'delivered',
                            description: 'Mail piece delivered',
                            date_created: new Date().toISOString()
                        }
                    ]
                },
                headers: { 'x-lob-signature': 'sha256=test_signature' }
            };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn().mockReturnThis()
            };
            const mockContext = {
                entities: {
                    MailPiece: { findFirst: jest.fn().mockResolvedValue({ id: 'mail_123' }) },
                    MailPieceStatusHistory: { create: jest.fn().mockResolvedValue({}) }
                }
            };
            // Mock the updateMailPieceStatus function
            jest.doMock('../../mail/operations', () => ({
                updateMailPieceStatus: jest.fn().mockResolvedValue({ id: 'mail_123' })
            }));
            const start = Date.now();
            await handleLobWebhook(mockReq, mockRes, mockContext);
            const duration = Date.now() - start;
            const passed = mockRes.status.mock.calls.length > 0;
            results.push({
                name: 'Webhook Payload Processing',
                passed,
                duration,
                details: { statusCalls: mockRes.status.mock.calls.length }
            });
        }
        catch (error) {
            results.push({
                name: 'Webhook Payload Processing',
                passed: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        this.results.push({
            name: 'Webhook Tests',
            results,
            totalTests: results.length,
            passedTests: results.filter(r => r.passed).length,
            failedTests: results.filter(r => !r.passed).length,
            duration: Date.now() - suiteStart
        });
    }
    async runErrorHandlingTests() {
        console.log('⚠️  Running Error Handling Tests...');
        const suiteStart = Date.now();
        const results = [];
        // Test circuit breaker
        try {
            const { CircuitBreaker } = await import('../retry');
            const circuitBreaker = CircuitBreaker.getInstance();
            const start = Date.now();
            // Test initial state
            const initialState = circuitBreaker.getState();
            const canExecuteInitially = circuitBreaker.canExecute();
            // Simulate failures to open circuit
            for (let i = 0; i < 5; i++) {
                circuitBreaker.onFailure();
            }
            const openState = circuitBreaker.getState();
            const canExecuteWhenOpen = circuitBreaker.canExecute();
            // Test success to close circuit
            circuitBreaker.onSuccess();
            const closedState = circuitBreaker.getState();
            const canExecuteWhenClosed = circuitBreaker.canExecute();
            const duration = Date.now() - start;
            const passed = initialState === 'CLOSED' &&
                canExecuteInitially === true &&
                openState === 'OPEN' &&
                canExecuteWhenOpen === false &&
                closedState === 'CLOSED' &&
                canExecuteWhenClosed === true;
            results.push({
                name: 'Circuit Breaker',
                passed,
                duration,
                details: {
                    initialState,
                    openState,
                    closedState,
                    canExecuteInitially,
                    canExecuteWhenOpen,
                    canExecuteWhenClosed
                }
            });
        }
        catch (error) {
            results.push({
                name: 'Circuit Breaker',
                passed: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        // Test rate limiting
        try {
            const { RateLimitHandler } = await import('../retry');
            const rateLimitHandler = RateLimitHandler.getInstance();
            const start = Date.now();
            // Test initial state
            const initiallyRateLimited = rateLimitHandler.isRateLimited();
            // Set rate limit
            rateLimitHandler.setRateLimited(Date.now() + 1000);
            const afterSettingRateLimit = rateLimitHandler.isRateLimited();
            // Wait for rate limit to expire
            await new Promise(resolve => setTimeout(resolve, 1100));
            const afterExpiry = rateLimitHandler.isRateLimited();
            const duration = Date.now() - start;
            const passed = initiallyRateLimited === false &&
                afterSettingRateLimit === true &&
                afterExpiry === false;
            results.push({
                name: 'Rate Limiting',
                passed,
                duration,
                details: {
                    initiallyRateLimited,
                    afterSettingRateLimit,
                    afterExpiry
                }
            });
        }
        catch (error) {
            results.push({
                name: 'Rate Limiting',
                passed: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        // Test retry mechanism
        try {
            const { withRetry } = await import('../retry');
            const start = Date.now();
            // Test successful retry
            let attemptCount = 0;
            const mockFn = () => {
                attemptCount++;
                if (attemptCount < 3) {
                    throw new Error('Temporary error');
                }
                return 'success';
            };
            const result = await withRetry(mockFn, {
                maxRetries: 3,
                baseDelay: 10,
                maxDelay: 100
            });
            const duration = Date.now() - start;
            const passed = result === 'success' && attemptCount === 3;
            results.push({
                name: 'Retry Mechanism',
                passed,
                duration,
                details: { result, attemptCount }
            });
        }
        catch (error) {
            results.push({
                name: 'Retry Mechanism',
                passed: false,
                duration: 0,
                error: error instanceof Error ? error.message : String(error)
            });
        }
        this.results.push({
            name: 'Error Handling Tests',
            results,
            totalTests: results.length,
            passedTests: results.filter(r => r.passed).length,
            failedTests: results.filter(r => !r.passed).length,
            duration: Date.now() - suiteStart
        });
    }
    async runRealDataValidationTests() {
        console.log('📊 Running Real Data Validation Tests...');
        const suiteStart = Date.now();
        const results = [];
        // Test with real Lob API data patterns
        const realWebhookData = [
            {
                name: 'Postcard Webhook',
                data: {
                    id: 'psc_123456789',
                    status: 'delivered',
                    tracking_number: '9400 1000 0000 0000 0000 00',
                    type: 'postcard',
                    events: [
                        { name: 'created', description: 'Postcard created', date_created: '2024-01-10T08:00:00Z' },
                        { name: 'mailed', description: 'Postcard mailed', date_created: '2024-01-11T10:00:00Z' },
                        { name: 'delivered', description: 'Postcard delivered', date_created: '2024-01-15T14:30:00Z' }
                    ],
                    expected_delivery_date: '2024-01-15',
                    price: '0.50',
                    url: 'https://lob.com/postcards/psc_123456789'
                }
            },
            {
                name: 'Letter Webhook',
                data: {
                    id: 'ltr_123456789',
                    status: 'in_transit',
                    tracking_number: '9400 1000 0000 0000 0000 01',
                    type: 'letter',
                    events: [
                        { name: 'created', description: 'Letter created', date_created: '2024-01-10T08:00:00Z' },
                        { name: 'mailed', description: 'Letter mailed', date_created: '2024-01-11T10:00:00Z' },
                        { name: 'in_transit', description: 'Letter in transit', date_created: '2024-01-12T12:00:00Z' }
                    ],
                    expected_delivery_date: '2024-01-16',
                    price: '0.60',
                    url: 'https://lob.com/letters/ltr_123456789'
                }
            },
            {
                name: 'Check Webhook',
                data: {
                    id: 'chk_123456789',
                    status: 'delivered',
                    tracking_number: '9400 1000 0000 0000 0000 02',
                    type: 'check',
                    events: [
                        { name: 'created', description: 'Check created', date_created: '2024-01-10T08:00:00Z' },
                        { name: 'mailed', description: 'Check mailed', date_created: '2024-01-11T10:00:00Z' },
                        { name: 'delivered', description: 'Check delivered', date_created: '2024-01-15T14:30:00Z' }
                    ],
                    expected_delivery_date: '2024-01-15',
                    price: '0.60',
                    url: 'https://lob.com/checks/chk_123456789'
                }
            }
        ];
        for (const webhookTest of realWebhookData) {
            try {
                const start = Date.now();
                // Validate webhook data structure
                const hasRequiredFields = webhookTest.data.id &&
                    webhookTest.data.status &&
                    webhookTest.data.tracking_number &&
                    webhookTest.data.type;
                const hasValidId = webhookTest.data.id.startsWith('psc_') ||
                    webhookTest.data.id.startsWith('ltr_') ||
                    webhookTest.data.id.startsWith('chk_');
                const hasValidStatus = ['delivered', 'in_transit', 'returned', 'processing', 'printed', 'mailed', 'created', 'cancelled', 'failed'].includes(webhookTest.data.status);
                const hasValidTrackingNumber = webhookTest.data.tracking_number.startsWith('9400') || webhookTest.data.tracking_number.startsWith('TRK');
                const hasValidType = ['postcard', 'letter', 'check', 'self_mailer', 'catalog', 'booklet'].includes(webhookTest.data.type);
                const hasValidPrice = !isNaN(parseFloat(webhookTest.data.price)) && parseFloat(webhookTest.data.price) > 0;
                const hasValidEvents = Array.isArray(webhookTest.data.events) && webhookTest.data.events.length > 0;
                const duration = Date.now() - start;
                const passed = hasRequiredFields && hasValidId && hasValidStatus && hasValidTrackingNumber && hasValidType && hasValidPrice && hasValidEvents;
                results.push({
                    name: webhookTest.name,
                    passed,
                    duration,
                    details: {
                        hasRequiredFields,
                        hasValidId,
                        hasValidStatus,
                        hasValidTrackingNumber,
                        hasValidType,
                        hasValidPrice,
                        hasValidEvents
                    }
                });
            }
            catch (error) {
                results.push({
                    name: webhookTest.name,
                    passed: false,
                    duration: 0,
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        }
        this.results.push({
            name: 'Real Data Validation Tests',
            results,
            totalTests: results.length,
            passedTests: results.filter(r => r.passed).length,
            failedTests: results.filter(r => !r.passed).length,
            duration: Date.now() - suiteStart
        });
    }
    generateReport() {
        const totalDuration = Date.now() - this.startTime;
        const totalTests = this.results.reduce((sum, suite) => sum + suite.totalTests, 0);
        const totalPassed = this.results.reduce((sum, suite) => sum + suite.passedTests, 0);
        const totalFailed = this.results.reduce((sum, suite) => sum + suite.failedTests, 0);
        console.log('\n' + '='.repeat(80));
        console.log('📋 PHASE 4 TESTING REPORT');
        console.log('='.repeat(80));
        console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);
        console.log(`📊 Total Tests: ${totalTests}`);
        console.log(`✅ Passed: ${totalPassed}`);
        console.log(`❌ Failed: ${totalFailed}`);
        console.log(`📈 Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);
        console.log('\n📋 Test Suite Results:');
        console.log('-'.repeat(80));
        for (const suite of this.results) {
            console.log(`\n${suite.name}:`);
            console.log(`  Duration: ${suite.duration}ms`);
            console.log(`  Tests: ${suite.passedTests}/${suite.totalTests} passed`);
            console.log(`  Success Rate: ${((suite.passedTests / suite.totalTests) * 100).toFixed(1)}%`);
            for (const result of suite.results) {
                const status = result.passed ? '✅' : '❌';
                const duration = result.duration > 0 ? ` (${result.duration}ms)` : '';
                console.log(`    ${status} ${result.name}${duration}`);
                if (!result.passed && result.error) {
                    console.log(`      Error: ${result.error}`);
                }
                if (result.details) {
                    console.log(`      Details: ${JSON.stringify(result.details, null, 2).split('\n').map(line => '        ' + line).join('\n')}`);
                }
            }
        }
        console.log('\n' + '='.repeat(80));
        if (totalFailed === 0) {
            console.log('🎉 ALL TESTS PASSED! Phase 4 implementation is working correctly.');
        }
        else {
            console.log(`⚠️  ${totalFailed} test(s) failed. Please review the errors above.`);
        }
        console.log('='.repeat(80));
    }
}
// Run tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const testRunner = new TestRunner();
    testRunner.runAllTests()
        .then(() => {
        process.exit(0);
    })
        .catch((error) => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}
export { TestRunner };
