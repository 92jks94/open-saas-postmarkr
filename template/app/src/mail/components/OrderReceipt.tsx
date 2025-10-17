import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Button } from '../../components/ui/button';
import { 
  Package, 
  MapPin, 
  User, 
  CreditCard,
  AlertCircle,
  Download,
  Printer,
  Mail,
  Loader2
} from 'lucide-react';
import type { MailPieceWithRelations } from '../types';
import {
  // Existing utilities
  formatDate,
  formatCurrency,
  getStatusBadgeVariant,
  getStatusIcon,
  // New utilities
  generateOrderNumber,
  formatDateShort,
  formatMailClass,
  formatAddressFull,
  getCostBreakdown
} from '../utils';
import { getReceiptDownloadUrl, sendReceiptEmail } from 'wasp/client/operations';
import { toast } from 'react-hot-toast';

interface OrderReceiptProps {
  mailPiece: MailPieceWithRelations;
  onPayNow?: () => void;
  isProcessingPayment?: boolean;
  className?: string;
}

/**
 * OrderReceipt - Receipt-style display of mail piece order details
 * 
 * Displays comprehensive order information in a scannable, receipt-like format
 * including status, specifications, addresses, and cost breakdown.
 */
export const OrderReceipt: React.FC<OrderReceiptProps> = ({
  mailPiece,
  onPayNow,
  isProcessingPayment = false,
  className = ''
}) => {
  const orderNumber = generateOrderNumber(mailPiece.paymentIntentId, mailPiece.id);
  const costBreakdown = getCostBreakdown(mailPiece.cost || mailPiece.customerPrice || 0);
  
  // State for receipt actions
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = async () => {
    if (isDownloadingReceipt) return;
    
    try {
      setIsDownloadingReceipt(true);
      toast.loading('Generating receipt...', { id: 'download-receipt' });
      
      const result = await getReceiptDownloadUrl({ mailPieceId: mailPiece.id });
      
      // Open download URL in new tab
      window.open(result.downloadUrl, '_blank');
      
      toast.success('Receipt downloaded successfully!', { id: 'download-receipt' });
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast.error('Failed to download receipt. Please try again.', { id: 'download-receipt' });
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const handleSendReceiptEmail = async () => {
    if (isSendingEmail) return;
    
    try {
      setIsSendingEmail(true);
      toast.loading('Sending receipt email...', { id: 'send-email' });
      
      await sendReceiptEmail({ mailPieceId: mailPiece.id });
      
      toast.success('Receipt email sent successfully!', { id: 'send-email' });
    } catch (error) {
      console.error('Failed to send receipt email:', error);
      toast.error('Failed to send receipt email. Please try again.', { id: 'send-email' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <Card className={`${className} print:shadow-none`}>
      <CardHeader className="border-b print:border-gray-300">
        <div className="space-y-2">
          <CardTitle className="text-lg">Order Summary</CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Order #{orderNumber}
            </p>
            <p className="text-xs text-gray-500">
              {formatDateShort(mailPiece.createdAt)}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(mailPiece.status)}
            <span className="text-sm font-medium text-gray-700">Status</span>
          </div>
          <Badge variant={getStatusBadgeVariant(mailPiece.status)}>
            {mailPiece.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>

        <Separator />

        {/* Mail Specifications */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Package className="h-4 w-4" />
            <span>Mail Details</span>
          </div>
          <div className="pl-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type</span>
              <span className="font-medium capitalize">{mailPiece.mailType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Class</span>
              <span className="font-medium">{formatMailClass(mailPiece.mailClass)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Size</span>
              <span className="font-medium">{mailPiece.mailSize}</span>
            </div>
            {mailPiece.pageCount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Pages</span>
                <span className="font-medium">{mailPiece.pageCount}</span>
              </div>
            )}
            {mailPiece.lobTrackingNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tracking</span>
                <span className="font-medium text-xs">{mailPiece.lobTrackingNumber}</span>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Addresses */}
        <div className="space-y-4">
          {/* From Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <User className="h-4 w-4" />
              <span>From</span>
            </div>
            {mailPiece.senderAddress ? (
              <div className="pl-6 text-sm text-gray-600 space-y-0.5">
                {formatAddressFull(mailPiece.senderAddress).map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="pl-6 text-sm text-gray-500">No sender address</p>
            )}
          </div>

          {/* To Address */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <MapPin className="h-4 w-4" />
              <span>To</span>
            </div>
            {mailPiece.recipientAddress ? (
              <div className="pl-6 text-sm text-gray-600 space-y-0.5">
                {formatAddressFull(mailPiece.recipientAddress).map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
              </div>
            ) : (
              <p className="pl-6 text-sm text-gray-500">No recipient address</p>
            )}
          </div>
        </div>

        <Separator />

        {/* Cost Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <CreditCard className="h-4 w-4" />
            <span>Cost Breakdown</span>
          </div>
          <div className="pl-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mail Service</span>
              <span>{formatCurrency(costBreakdown.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing & Handling</span>
              <span>{formatCurrency(costBreakdown.processing)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(costBreakdown.total)}</span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Payment Status</span>
            <Badge variant={mailPiece.paymentStatus === 'paid' ? 'default' : 'outline'}>
              {mailPiece.paymentStatus.toUpperCase()}
            </Badge>
          </div>
          {mailPiece.paymentIntentId && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment ID</span>
              <span className="text-xs text-gray-400 font-mono">
                {mailPiece.paymentIntentId.slice(-8)}
              </span>
            </div>
          )}
        </div>

        {/* Pay Now CTA */}
        {mailPiece.status === 'pending_payment' && onPayNow && (
          <div className="pt-2 space-y-3">
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-800">
                Payment is required before your mail piece can be processed and sent.
              </p>
            </div>
            <Button
              className="w-full"
              size="lg"
              onClick={onPayNow}
              disabled={isProcessingPayment}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isProcessingPayment ? 'Processing...' : `Pay ${formatCurrency(costBreakdown.total)}`}
            </Button>
          </div>
        )}

        {/* Receipt Actions - Only show for paid orders */}
        {mailPiece.paymentStatus === 'paid' && (
          <div className="space-y-2 pt-2 print:hidden">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadReceipt}
                disabled={isDownloadingReceipt}
                className="flex-1"
              >
                {isDownloadingReceipt ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {isDownloadingReceipt ? 'Generating...' : 'Download PDF'}
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSendReceiptEmail}
              disabled={isSendingEmail}
              className="w-full"
            >
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              {isSendingEmail ? 'Sending...' : 'Email Receipt'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderReceipt;

