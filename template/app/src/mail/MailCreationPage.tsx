import React, { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '../components/ui/alert';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import MailCreationForm from './components/MailCreationForm';

/**
 * Main page component for creating new mail pieces
 * 
 * Features:
 * - Renders MailCreationForm for mail piece creation
 * - Handles success/error states with user feedback
 * - Provides navigation to created mail piece or history
 * - Shows success confirmation with next steps
 */
const MailCreationPage: React.FC = () => {
  const { data: user } = useAuth();
  const navigate = useNavigate();
  const [createdMailPieceId, setCreatedMailPieceId] = useState<string | null>(null);

  const handleSuccess = (mailPieceId: string) => {
    setCreatedMailPieceId(mailPieceId);
  };

  const handleViewMailPiece = () => {
    if (createdMailPieceId) {
      navigate(`/mail/${createdMailPieceId}`);
    }
  };

  const handleBackToHistory = () => {
    navigate('/mail/history');
  };

  if (createdMailPieceId) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Mail Piece Created Successfully!
              </h1>
              <p className="text-gray-600 mb-8">
                Your mail piece has been created and is ready for processing.
              </p>
              
              <div className="space-y-4">
                <Button onClick={handleViewMailPiece} className="mr-4">
                  View Mail Piece Details
                </Button>
                <Button variant="outline" onClick={handleBackToHistory}>
                  Back to Mail History
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/mail/history')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mail History
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Create Mail Piece
          </h1>
          <p className="text-gray-600 mt-2">
            Send physical mail with professional tracking and delivery confirmation.
          </p>
        </div>

        {/* Simplified Implementation Notice */}
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Simplified Mode:</strong> Basic mail creation for testing. Select files and addresses to create mail pieces.
          </AlertDescription>
        </Alert>

        {/* Mail Creation Form */}
        <MailCreationForm onSuccess={handleSuccess} />
      </div>
    </div>
  );
};

export default MailCreationPage;
