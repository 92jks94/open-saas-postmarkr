// ============================================================================
// UNIVERSAL AUTH FORM WRAPPER COMPONENT
// ============================================================================
// Wrapper component that provides consistent error handling and positioning
// for all authentication forms across the application

import { ReactNode, useState, useEffect } from 'react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import AuthPageLayout from '../AuthPageLayout';

interface AuthFormWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  error?: string | null;
  success?: string | null;
  isLoading?: boolean;
  showSuccessAlert?: boolean;
}

export function AuthFormWrapper({ 
  title, 
  subtitle, 
  children, 
  error, 
  success, 
  isLoading = false,
  showSuccessAlert = true 
}: AuthFormWrapperProps) {
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle error display with animation
  useEffect(() => {
    if (error) {
      setShowError(true);
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowError(false);
    }
  }, [error]);

  // Handle success display
  useEffect(() => {
    if (success && showSuccessAlert) {
      setShowSuccess(true);
      // Scroll to top to show success
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setShowSuccess(false);
    }
  }, [success, showSuccessAlert]);

  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 mb-6">
              {subtitle}
            </p>
          )}
        </div>

        {/* Error Alert - positioned at top for visibility */}
        {showError && error && (
          <Alert className="bg-red-50 border-red-200 animate-in slide-in-from-top-2 duration-300">
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Alert - positioned at top for visibility */}
        {showSuccess && success && (
          <Alert className="bg-green-50 border-green-200 animate-in slide-in-from-top-2 duration-300">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </div>
          </div>
        )}

        {/* Form Content */}
        {!isLoading && children}
      </div>
    </AuthPageLayout>
  );
}

// Hook for managing auth form state consistently
export function useAuthFormState() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setSuccess(null);
    setIsLoading(false);
  };

  const handleSuccess = (successMessage: string) => {
    setSuccess(successMessage);
    setError(null);
    setIsLoading(false);
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null);
      setSuccess(null);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    error,
    success,
    isLoading,
    handleError,
    handleSuccess,
    handleLoading,
    clearMessages
  };
}
