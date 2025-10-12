import React from 'react';
import { Sentry } from './sentry';
import { testSentryError, testSentryMessage } from 'wasp/client/operations';

/**
 * Test page for verifying Sentry integration
 * This page allows you to test both client-side and server-side error tracking
 */
export default function SentryTestPage() {
  const triggerClientError = () => {
    // This will trigger a client-side error that Sentry should capture
    throw new Error('Test client-side error for Sentry');
  };

  const triggerClientMessage = () => {
    // This will send a test message to Sentry
    Sentry.captureMessage('Test message from client', 'info');
    alert('Test message sent to Sentry!');
  };

  const triggerClientBreadcrumb = () => {
    // This will add a breadcrumb to Sentry
    Sentry.addBreadcrumb({
      message: 'User clicked test breadcrumb button',
      category: 'test',
      level: 'info',
    });
    alert('Breadcrumb added to Sentry!');
  };

  const testServerError = async () => {
    try {
      // Call the test operation
      const result = await testSentryError({});
      
      alert(`Server error test completed: ${result.message}`);
    } catch (error) {
      console.error('Server error test failed:', error);
      alert('Server error test failed - check console for details');
    }
  };

  const testServerMessage = async () => {
    try {
      // Call the test operation
      const result = await testSentryMessage({});
      
      alert(`Server message test completed: ${result.message}`);
    } catch (error) {
      console.error('Server message test failed:', error);
      alert('Server message test failed - check console for details');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Sentry Integration Test
          </h1>
          
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-yellow-800 mb-2">
                ⚠️ Important
              </h2>
              <p className="text-yellow-700">
                Make sure you have set your Sentry DSN in both:
              </p>
              <ul className="list-disc list-inside text-yellow-700 mt-2 space-y-1">
                <li><code>.env.server</code> - for server-side errors</li>
                <li>Environment variable <code>REACT_APP_SENTRY_DSN</code> - for client-side errors</li>
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-4">
                  Client-Side Tests
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={triggerClientError}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Trigger Client Error
                  </button>
                  
                  <button
                    onClick={triggerClientMessage}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Send Test Message
                  </button>
                  
                  <button
                    onClick={triggerClientBreadcrumb}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Add Breadcrumb
                  </button>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-4">
                  Server-Side Tests
                </h3>
                <div className="space-y-3">
                  <button
                    onClick={testServerError}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Test Server Error
                  </button>
                  
                  <button
                    onClick={testServerMessage}
                    className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  >
                    Test Server Message
                  </button>
                  
                  <p className="text-sm text-purple-700">
                    Test server-side Sentry integration with error capture and message logging.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                How to Verify
              </h3>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>Click the buttons above to trigger different types of events</li>
                <li>Check your Sentry dashboard at <a href="https://sentry.io" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">sentry.io</a></li>
                <li>Look for new events in the "Issues" and "Performance" sections</li>
                <li>Verify that errors include proper context and user information</li>
              </ol>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-800 mb-2">
                ✅ Success Indicators
              </h3>
              <ul className="list-disc list-inside text-green-700 space-y-1">
                <li>Errors appear in your Sentry dashboard within a few minutes</li>
                <li>Error reports include stack traces and context</li>
                <li>Performance data shows up in the Performance tab</li>
                <li>Session replays are captured (if enabled)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
