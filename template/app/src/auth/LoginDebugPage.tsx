import React, { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { LoginForm } from 'wasp/client/auth';
import AuthPageLayout from './AuthPageLayout';

export default function LoginDebugPage() {
  const { data: user, isLoading, error } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLoginError = (error: any) => {
    console.error('Login error:', error);
    setLoginError(error.message || 'Login failed');
  };

  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Login Debug Page
          </h1>
          <p className="text-gray-600">
            This page helps debug login issues
          </p>
        </div>

        {/* Current Auth State */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Current Auth State:</h3>
          <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          <p><strong>User:</strong> {user ? `ID: ${user.id}` : 'Not logged in'}</p>
          <p><strong>Error:</strong> {error ? (error as any)?.message || 'Unknown error' : 'None'}</p>
        </div>

        {/* Login Form */}
        <div>
          <h3 className="font-semibold mb-2">Login Form:</h3>
          <LoginForm />
        </div>

        {/* Error Display */}
        {loginError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>Login Error:</strong> {loginError}
          </div>
        )}

        {/* Environment Info */}
        <div className="bg-blue-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Environment Info:</h3>
          <p><strong>Client URL:</strong> {window.location.origin}</p>
          <p><strong>Server URL:</strong> {process.env.REACT_APP_SERVER_URL || 'Not set'}</p>
          <p><strong>Node Env:</strong> {process.env.NODE_ENV || 'Not set'}</p>
        </div>
      </div>
    </AuthPageLayout>
  );
}
