#!/usr/bin/env node
/**
 * Comprehensive Test Runner for Phase 4 Lob API Integration
 *
 * Runs all tests and provides detailed reporting with real data validation
 */
declare class TestRunner {
    private results;
    private startTime;
    runAllTests(): Promise<void>;
    private runIntegrationTests;
    private runUnitTests;
    private runWebhookTests;
    private runErrorHandlingTests;
    private runRealDataValidationTests;
    private generateReport;
}
export { TestRunner };
