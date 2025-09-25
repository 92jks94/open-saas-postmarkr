import React from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { checkUserAccess } from 'wasp/client/operations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { CheckCircle, Lock, Mail } from 'lucide-react';

export default function UpgradeAccessPage() {
  const { data: user } = useAuth();
  const { data: accessData, isLoading: accessLoading } = useQuery(checkUserAccess);

  if (accessLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  // User has full access
  if (accessData?.hasFullAccess) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Full Access Active</CardTitle>
            <CardDescription>
              You have full access to all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center text-sm text-gray-600">
              <p>✓ All features unlocked</p>
              <p>✓ Priority support available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has beta access - show beta status
  if (accessData?.hasBetaAccess) {
    return (
      <div className="max-w-md mx-auto p-6">
        <Card>
          <CardHeader className="text-center">
            <Lock className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <CardTitle className="text-2xl">Beta Access Active</CardTitle>
            <CardDescription>
              You have beta access to the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-blue-800 mb-2">
                  <Lock className="w-4 h-4" />
                  <span className="font-medium">Current Access: Beta</span>
                </div>
                <p className="text-xs text-blue-700">
                  You have access to beta features. Contact an administrator to upgrade to full access.
                </p>
              </div>
              
              <div className="text-sm text-gray-600">
                <p>✓ Beta features available</p>
                <p>✓ Early access to new functionality</p>
                <p>• Contact admin for full access upgrade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has no access - show coming soon message
  return (
    <div className="max-w-md mx-auto p-6">
      <Card>
        <CardHeader className="text-center">
          <Mail className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <CardTitle className="text-2xl">Coming Soon!</CardTitle>
          <CardDescription>
            Thanks for signing up! We'll email you when beta access is available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              We're currently in closed beta. You'll receive an email notification 
              when your access is ready.
            </p>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>What to expect:</strong>
              </p>
              <ul className="text-xs text-blue-700 mt-2 space-y-1">
                <li>• Email notification when access is ready</li>
                <li>• Full access to all features</li>
                <li>• Priority support</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
