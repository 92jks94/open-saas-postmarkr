import React, { useState, useEffect } from 'react';
import { createMailCheckoutSession } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { 
  CreditCard, 
  CheckCircle, 
  AlertTriangle, 
  Loader2,
  DollarSign,
  Mail,
  MapPin,
  FileText
} from 'lucide-react';
import type { MailPiece, MailAddress, File } from 'wasp/entities';

// Note: Stripe Elements provider is handled at the app level

/**
 * Props for the PaymentStep component
 */
interface PaymentStepProps {
  /** The mail piece to create payment for */
  mailPiece: MailPiece & {
    senderAddress: MailAddress;
    recipientAddress: MailAddress;
    file?: File | null;
  };
  /** Callback fired when payment is successfully completed */
  onPaymentSuccess?: (mailPieceId: string) => void;
  /** Callback fired when payment is cancelled or fails */
  onPaymentCancel?: () => void;
  /** Optional CSS classes for styling */
  className?: string;
}

/**
 * Payment form component using existing Wasp operations
 */
const PaymentForm: React.FC<{
  mailPiece: PaymentStepProps['mailPiece'];
  onPaymentSuccess?: (mailPieceId: string) => void;
  onPaymentCancel?: () => void;
}> = ({ mailPiece, onPaymentSuccess, onPaymentCancel }) => {
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [cost, setCost] = useState<number | null>(null);
  const [isLoadingCost, setIsLoadingCost] = useState(true);

  // Calculate cost when component mounts
  useEffect(() => {
    const calculateCost = async () => {
      try {
        setIsLoadingCost(true);
        
        // Calculate cost based on page count using the pricing tiers
        if (mailPiece.file?.pageCount) {
          const pageCount = mailPiece.file.pageCount;
          let estimatedCost = 250; // Default to tier 1 ($2.50)
          
          if (pageCount <= 5) {
            estimatedCost = 250; // $2.50
          } else if (pageCount <= 20) {
            estimatedCost = 750; // $7.50
          } else if (pageCount <= 60) {
            estimatedCost = 2000; // $20.00
          } else {
            throw new Error('Document too large for processing');
          }
          
          setCost(estimatedCost);
        } else {
          // Fallback if no page count available
          setCost(250); // $2.50 default
        }
      } catch (error: any) {
        console.error('Failed to calculate cost:', error);
        setPaymentError('Failed to calculate cost. Please try again.');
      } finally {
        setIsLoadingCost(false);
      }
    };

    calculateCost();
  }, [mailPiece.id, mailPiece.file?.pageCount]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setIsProcessing(true);
    setPaymentError(null);

    try {
      // Create Stripe Checkout Session
      const checkoutData = await createMailCheckoutSession({
        mailPieceId: mailPiece.id
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutData.sessionUrl;
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentError(error.message || 'Payment failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const formatCost = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getMailTypeDisplay = (mailType: string) => {
    const types: Record<string, string> = {
      'letter': 'Letter'
      // COMMENTED OUT FOR LAUNCH - Will be re-enabled in future updates
      // 'postcard': 'Postcard',
      // 'check': 'Check',
      // 'self_mailer': 'Self Mailer',
      // 'catalog': 'Catalog',
      // 'booklet': 'Booklet'
    };
    return types[mailType] || mailType;
  };

  const getMailClassDisplay = (mailClass: string) => {
    const classes: Record<string, string> = {
      'usps_first_class': 'First Class'
      // COMMENTED OUT FOR LAUNCH - Will be re-enabled in future updates
      // 'usps_standard': 'Standard',
      // 'usps_express': 'Express',
      // 'usps_priority': 'Priority'
    };
    return classes[mailClass] || mailClass;
  };

  return (
    <div className="space-y-6">
      {/* Mail Piece Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Mail Piece Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">From</h4>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{mailPiece.senderAddress.contactName}</p>
                  <p className="text-sm text-gray-600">
                    {mailPiece.senderAddress.addressLine1}
                    {mailPiece.senderAddress.addressLine2 && (
                      <span>, {mailPiece.senderAddress.addressLine2}</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {mailPiece.senderAddress.city}, {mailPiece.senderAddress.state} {mailPiece.senderAddress.postalCode}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-gray-500 mb-2">To</h4>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">{mailPiece.recipientAddress.contactName}</p>
                  <p className="text-sm text-gray-600">
                    {mailPiece.recipientAddress.addressLine1}
                    {mailPiece.recipientAddress.addressLine2 && (
                      <span>, {mailPiece.recipientAddress.addressLine2}</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {mailPiece.recipientAddress.city}, {mailPiece.recipientAddress.state} {mailPiece.recipientAddress.postalCode}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Type:</span>
              <p className="font-medium">{getMailTypeDisplay(mailPiece.mailType)}</p>
            </div>
            <div>
              <span className="text-gray-500">Class:</span>
              <p className="font-medium">{getMailClassDisplay(mailPiece.mailClass)}</p>
            </div>
            <div>
              <span className="text-gray-500">Size:</span>
              <p className="font-medium">{mailPiece.mailSize}</p>
            </div>
            <div>
              <span className="text-gray-500">File:</span>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4 text-gray-400" />
                <p className="font-medium">{mailPiece.file?.name || 'No file'}</p>
              </div>
            </div>
          </div>

          {mailPiece.description && (
            <>
              <Separator />
              <div>
                <span className="text-gray-500 text-sm">Description:</span>
                <p className="text-sm mt-1">{mailPiece.description}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingCost ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Calculating cost...</span>
            </div>
          ) : cost !== null ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Base Cost:</span>
                <span>{formatCost(cost)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                <span>Total:</span>
                <span>{formatCost(cost)}</span>
              </div>
            </div>
          ) : (
            <div className="text-red-600 text-sm">
              Unable to calculate cost. Please try again.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="border border-gray-300 rounded-md p-4 bg-blue-50">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      Secure Payment with Stripe
                    </p>
                    <p className="text-xs text-blue-700">
                      You'll be redirected to Stripe's secure checkout page
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {paymentError && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{paymentError}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isProcessing || isLoadingCost || cost === null}
                className="flex-1"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay {cost ? formatCost(cost) : ''}
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={onPaymentCancel}
                disabled={isProcessing}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Main PaymentStep component using existing Wasp operations
 */
const PaymentStep: React.FC<PaymentStepProps> = ({
  mailPiece,
  onPaymentSuccess,
  onPaymentCancel,
  className = ''
}) => {
  return (
    <div className={className}>
      <PaymentForm
        mailPiece={mailPiece}
        onPaymentSuccess={onPaymentSuccess}
        onPaymentCancel={onPaymentCancel}
      />
    </div>
  );
};

export default PaymentStep;
