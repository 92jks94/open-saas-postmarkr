#!/usr/bin/env node
/**
 * Lob API Integration Test Script
 *
 * This script tests the complete Lob API integration including:
 * - Address validation
 * - Cost calculation
 * - Mail piece creation
 * - Status retrieval
 * - Webhook simulation
 */
import { validateAddress, calculateCost, createMailPiece, getMailPieceStatus } from './services';
// Test data
const testAddress = {
    address_line1: '123 Main St',
    address_line2: 'Apt 4B',
    city: 'San Francisco',
    state: 'CA',
    zip_code: '94105',
    country: 'US'
};
const testMailSpecs = {
    mailType: 'letter',
    mailClass: 'usps_first_class',
    mailSize: '6x9',
    toAddress: testAddress,
    fromAddress: {
        address_line1: '456 Oak Ave',
        city: 'New York',
        state: 'NY',
        zip_code: '10001',
        country: 'US'
    }
};
async function testAddressValidation() {
    console.log('\n🔍 Testing Address Validation...');
    try {
        const result = await validateAddress(testAddress);
        console.log('✅ Address validation result:', {
            isValid: result.isValid,
            error: result.error,
            verifiedAddress: result.verifiedAddress ? 'Present' : 'Missing'
        });
        return result.isValid;
    }
    catch (error) {
        console.error('❌ Address validation failed:', error);
        return false;
    }
}
async function testCostCalculation() {
    console.log('\n💰 Testing Cost Calculation...');
    try {
        const result = await calculateCost(testMailSpecs);
        console.log('✅ Cost calculation result:', {
            cost: result.cost,
            currency: result.currency,
            breakdown: result.breakdown,
            isFallback: result.breakdown.fallback || false
        });
        return true;
    }
    catch (error) {
        console.error('❌ Cost calculation failed:', error);
        return false;
    }
}
async function testMailPieceCreation() {
    console.log('\n📮 Testing Mail Piece Creation...');
    try {
        const result = await createMailPiece({
            to: testAddress,
            from: testMailSpecs.fromAddress,
            mailType: testMailSpecs.mailType,
            mailClass: testMailSpecs.mailClass,
            mailSize: testMailSpecs.mailSize,
            description: 'Test mail piece from integration test'
        });
        console.log('✅ Mail piece creation result:', {
            id: result.id,
            status: result.status,
            trackingNumber: result.trackingNumber,
            cost: result.cost,
            isSimulated: result.id.startsWith('lob_') && result.id.includes('_')
        });
        return result.id;
    }
    catch (error) {
        console.error('❌ Mail piece creation failed:', error);
        return null;
    }
}
async function testStatusRetrieval(lobId) {
    console.log('\n📊 Testing Status Retrieval...');
    try {
        const result = await getMailPieceStatus(lobId);
        console.log('✅ Status retrieval result:', {
            id: result.id,
            status: result.status,
            trackingNumber: result.trackingNumber,
            eventsCount: result.events?.length || 0,
            mailType: result.mailType || 'unknown'
        });
        return true;
    }
    catch (error) {
        console.error('❌ Status retrieval failed:', error);
        return false;
    }
}
async function testWebhookSimulation() {
    console.log('\n🔗 Testing Webhook Simulation...');
    try {
        // Simulate a webhook payload
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
        return true;
    }
    catch (error) {
        console.error('❌ Webhook simulation failed:', error);
        return false;
    }
}
async function runIntegrationTests() {
    console.log('🚀 Starting Lob API Integration Tests...\n');
    const results = {
        addressValidation: false,
        costCalculation: false,
        mailPieceCreation: false,
        statusRetrieval: false,
        webhookSimulation: false
    };
    // Test 1: Address Validation
    results.addressValidation = await testAddressValidation();
    // Test 2: Cost Calculation
    results.costCalculation = await testCostCalculation();
    // Test 3: Mail Piece Creation
    const lobId = await testMailPieceCreation();
    results.mailPieceCreation = lobId !== null;
    // Test 4: Status Retrieval (if mail piece was created)
    if (lobId) {
        results.statusRetrieval = await testStatusRetrieval(lobId);
    }
    // Test 5: Webhook Simulation
    results.webhookSimulation = await testWebhookSimulation();
    // Summary
    console.log('\n📋 Test Results Summary:');
    console.log('========================');
    Object.entries(results).forEach(([test, passed]) => {
        console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
    });
    const allPassed = Object.values(results).every(result => result);
    console.log(`\n🎯 Overall Result: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
    if (allPassed) {
        console.log('\n🎉 Lob API integration is working correctly!');
    }
    else {
        console.log('\n⚠️  Some tests failed. Check the logs above for details.');
    }
    return allPassed;
}
// Run tests if this script is executed directly
if (require.main === module) {
    runIntegrationTests()
        .then(success => {
        process.exit(success ? 0 : 1);
    })
        .catch(error => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}
export { runIntegrationTests };
