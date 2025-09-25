// ============================================================================
// ADMIN NOTIFICATION ANALYTICS PAGE - COMMENTED OUT FOR DEBUGGING
// ============================================================================
// This file has been temporarily disabled to fix compilation issues.
// All notification functionality is currently disabled.

// To re-enable, uncomment the notification operations in main.wasp and restore this file.

export default function NotificationAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Notification Analytics
          </h1>
          <div className="text-center py-12">
            <p className="text-gray-500">
              Notification analytics are currently disabled for debugging purposes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}