import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { Button } from '../../components/ui/button';
import { 
  Package, 
  CreditCard,
  AlertCircle,
  Edit
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
  getCostBreakdown,
  isDraftReadyForPayment
} from '../utils';
import { AddressDisplay } from './AddressDisplay';

interface OrderReceiptProps {
  mailPiece: MailPieceWithRelations;
  onPayNow?: () => void;
  onEditDraft?: () => void;
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
  onEditDraft,
  isProcessingPayment = false,
  className = ''
}) => {
  const orderNumber = generateOrderNumber(mailPiece.paymentIntentId, mailPiece.id);
  const costBreakdown = getCostBreakdown(mailPiece.cost || mailPiece.customerPrice || 0);

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
        {/* Action Buttons - Prominent placement at top */}
        {(mailPiece.status === 'pending_payment' || mailPiece.status === 'draft') && (
          <div className="space-y-3">
            {/* Pay Now CTA for pending payment */}
            {mailPiece.status === 'pending_payment' && onPayNow && (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={onPayNow}
                  disabled={isProcessingPayment}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {isProcessingPayment ? 'Processing...' : `Pay ${formatCurrency(costBreakdown.total)}`}
                </Button>
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800">
                    Payment is required before your mail piece can be processed and sent.
                  </p>
                </div>
              </>
            )}

            {/* Complete Draft CTA for incomplete drafts */}
            {mailPiece.status === 'draft' && !isDraftReadyForPayment(mailPiece) && onEditDraft && (
              <>
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                  onClick={onEditDraft}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Complete Mail Details
                </Button>
                <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-800">
                    Complete all required details to proceed with your mail piece.
                  </p>
                </div>
              </>
            )}
          </div>
        )}

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

        {/* Addresses - Two Column Layout */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AddressDisplay 
              address={mailPiece.senderAddress} 
              type="sender" 
            />
            <AddressDisplay 
              address={mailPiece.recipientAddress} 
              type="recipient" 
            />
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
      </CardContent>
    </Card>
  );
};

export default OrderReceipt;

