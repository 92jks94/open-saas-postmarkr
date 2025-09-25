import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { getMailPiece } from 'wasp/client/operations';
import type { MailPiece, MailAddress, File } from 'wasp/entities';

/**
 * Page component for handling mail checkout results
 * 
 * This page is shown after the user returns from Stripe Checkout.
 * It handles both success and cancel scenarios and provides appropriate feedback.
 */
export default function MailCheckoutResultPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [mailPiece, setMailPiece] = useState<MailPiece & {
    senderAddress: MailAddress;
    recipientAddress: MailAddress;
    file?: File | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const status = searchParams.get('status');
  const mailPieceId = searchParams.get('mail_piece_id');

  useEffect(() => {
    const loadMailPiece = async () => {
      if (!mailPieceId) {
        setError('No mail piece ID provided');
        setIsLoading(false);
        return;
      }

      try {
        const piece = await getMailPiece({ id: mailPieceId });
        if (piece) {
          setMailPiece(piece);
        } else {
          setError('Mail piece not found');
        }
      } catch (err: any) {
        console.error('Failed to load mail piece:', err);
        setError('Failed to load mail piece details');
      } finally {
        setIsLoading(false);
      }
    };

    loadMailPiece();
  }, [mailPieceId]);

  const handleViewMailPiece = () => {
    if (mailPieceId) {
      navigate(`/mail/${mailPieceId}`);
    }
  };

  const handleBackToHistory = () => {
    navigate('/mail/history');
  };

  const handleRetryPayment = () => {
    if (mailPieceId) {
      navigate(`/mail/create?retry=${mailPieceId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading mail piece details...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <XCircle className="h-5 w-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="mt-6">
                <Button onClick={handleBackToHistory} variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Mail History
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Payment Successful!
                </h1>
                <p className="text-gray-600 mb-8">
                  Your mail piece has been paid for and will be processed shortly.
                </p>
                
                {mailPiece && (
                  <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                    <h3 className="font-medium text-gray-900 mb-4">Mail Piece Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <p className="font-medium capitalize">{mailPiece.mailType}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Class:</span>
                        <p className="font-medium capitalize">{mailPiece.mailClass}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Size:</span>
                        <p className="font-medium">{mailPiece.mailSize}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Status:</span>
                        <p className="font-medium capitalize text-green-600">{mailPiece.status}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-4">
                  <Button onClick={handleViewMailPiece} className="mr-4">
                    View Mail Piece Details
                  </Button>
                  <Button variant="outline" onClick={handleBackToHistory}>
                    Back to Mail History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (status === 'canceled') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <XCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Payment Canceled
                </h1>
                <p className="text-gray-600 mb-8">
                  Your payment was canceled. You can try again or go back to your mail pieces.
                </p>
                
                <div className="space-y-4">
                  <Button onClick={handleRetryPayment} className="mr-4">
                    Try Payment Again
                  </Button>
                  <Button variant="outline" onClick={handleBackToHistory}>
                    Back to Mail History
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Unknown status
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                Unknown Status
              </h1>
              <p className="text-gray-600 mb-8">
                We couldn't determine the payment status. Please check your mail pieces.
              </p>
              
              <div className="space-y-4">
                <Button onClick={handleBackToHistory}>
                  Back to Mail History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

