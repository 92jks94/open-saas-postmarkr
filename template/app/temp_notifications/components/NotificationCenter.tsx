// ============================================================================
// NOTIFICATION CENTER COMPONENT - COMMENTED OUT FOR DEBUGGING
// ============================================================================
// This file has been temporarily disabled to fix compilation issues.
// All notification functionality is currently disabled.

// To re-enable, uncomment the notification operations in main.wasp and restore this file.

export default function NotificationCenter() {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        Notifications
      </h2>
      <div className="text-center py-8">
        <p className="text-gray-500">
          Notifications are currently disabled for debugging purposes.
        </p>
      </div>
    </div>
  );
}