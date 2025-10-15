import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldX, Home, Mail } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';

/**
 * Access Denied Page for Admin Routes
 * 
 * Shows a user-friendly message when non-admin users try to access admin pages.
 * Provides clear next steps and navigation options.
 */
export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-foreground">
            Admin Access Required
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              You need administrator privileges to access this page. If you believe this is an error, 
              please contact your system administrator.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="default"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to Homepage
            </Button>
            
            <Button 
              onClick={() => navigate('/mail/create')} 
              className="w-full"
              variant="outline"
            >
              <Mail className="h-4 w-4 mr-2" />
              Create Mail Piece
            </Button>
          </div>
          
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Need help? Contact support at{' '}
              <a 
                href="mailto:support@postmarkr.com" 
                className="text-primary hover:underline"
              >
                support@postmarkr.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
