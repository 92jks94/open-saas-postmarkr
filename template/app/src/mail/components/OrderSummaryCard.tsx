import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  Receipt, 
  FileText, 
  MapPin, 
  Mail, 
  DollarSign, 
  Package,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import type { File, MailAddress } from 'wasp/entities';
import { getPricingTierForPageCount } from '../../shared/constants/pricing';
import ExpandablePDFViewer from './ExpandablePDFViewer';
import { cn } from '../../lib/utils';

/**
 * Props for OrderSummaryCard component
 */
interface OrderSummaryCardProps {
  /** Selected file */
  selectedFile?: File | null;
  /** Sender address */
  senderAddress?: MailAddress | null;
  /** Recipient address */
  recipientAddress?: MailAddress | null;
  /** Mail configuration */
  mailConfig: {
    mailType: string;
    mailClass: string;
    mailSize: string;
    addressPlacement: 'top_first_page' | 'insert_blank_page';
  };
  /** Whether form is valid */
  isValid: boolean;
  /** Whether form is submitting */
  isSubmitting: boolean;
  /** Submit handler */
  onSubmit: () => void;
  /** Optional className */
  className?: string;
}

/**
 * OrderSummaryCard - Sticky sidebar showing order details
 * 
 * Features:
 * - PDF preview with expand capability
 * - Sender/Recipient delivery route
 * - Mail configuration summary
 * - Cost breakdown
 * - Prominent CTA button
 */
export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  selectedFile,
  senderAddress,
  recipientAddress,
  mailConfig,
  isValid,
  isSubmitting,
  onSubmit,
  className = ''
}) => {
  // Calculate pricing
  const pricingInfo = useMemo(() => {
    if (!selectedFile?.pageCount) return null;

    const documentPages = selectedFile.pageCount;
    const addressPages = mailConfig.addressPlacement === 'insert_blank_page' ? 1 : 0;
    const totalPages = documentPages + addressPages;
    const pricingTier = getPricingTierForPageCount(totalPages);

    return {
      documentPages,
      addressPages,
      totalPages,
      pricingTier
    };
  }, [selectedFile?.pageCount, mailConfig.addressPlacement]);

  // Format mail class for display
  const formatMailClass = (mailClass: string) => {
    return mailClass
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className={cn('sticky top-4 space-y-4', className)}>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Receipt className="h-5 w-5" />
            Order Summary
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* PDF Preview - Compact */}
          {selectedFile && selectedFile.key ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Document
                </h4>
                <Badge variant="outline" className="text-xs">
                  {selectedFile.pageCount} pages
                </Badge>
              </div>
              <div className="text-xs text-gray-600 truncate">{selectedFile.name}</div>
            </div>
          ) : (
            <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No file selected</p>
            </div>
          )}

          {/* Delivery Route - Compact */}
          {(senderAddress || recipientAddress) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Addresses
              </h4>
              
              <div className="space-y-1.5 text-xs">
                {senderAddress && (
                  <div className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                    <span className="text-blue-600 font-medium">From:</span>
                    <span className="text-gray-900 truncate">{senderAddress.contactName}</span>
                  </div>
                )}
                {recipientAddress && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <span className="text-green-600 font-medium">To:</span>
                    <span className="text-gray-900 truncate">{recipientAddress.contactName}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mail Configuration - Compact */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Configuration
            </h4>
            
            <div className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Type:</span>
                <span className="font-medium text-gray-900 capitalize">{mailConfig.mailType} • {formatMailClass(mailConfig.mailClass)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Size:</span>
                <span className="font-medium text-gray-900">{mailConfig.mailSize}</span>
              </div>
            </div>
          </div>

          {/* Cost Breakdown - Compact */}
          {pricingInfo && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Pricing
              </h4>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Pages:</span>
                  <span className="font-medium">{pricingInfo.documentPages}{pricingInfo.addressPages > 0 ? ` + ${pricingInfo.addressPages}` : ''} = {pricingInfo.totalPages}</span>
                </div>

                {pricingInfo.pricingTier && (
                  <>
                    <div className="flex justify-between text-gray-600">
                      <span>Envelope:</span>
                      <span className="font-medium text-gray-900">{pricingInfo.pricingTier.description.split(' - ')[0]}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300 mt-2">
                      <span className="font-semibold text-gray-900">Total:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${pricingInfo.pricingTier.priceInDollars.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-500 mt-2">
                Includes printing, envelope, postage & tracking.
              </p>
            </div>
          )}

          {!pricingInfo && selectedFile && (
            <div className="text-center py-3 px-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Select a file to calculate cost</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="pt-3 border-t space-y-2">
            <Button
              onClick={onSubmit}
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              loadingText="Creating..."
              size="lg"
              className="w-full"
            >
              {pricingInfo ? (
                <>
                  Continue to Payment
                  <Badge variant="secondary" className="ml-2 bg-white text-gray-900">
                    ${pricingInfo.pricingTier?.priceInDollars.toFixed(2)}
                  </Badge>
                </>
              ) : (
                'Complete Form to Continue'
              )}
            </Button>

            {!isValid && selectedFile && (
              <p className="text-xs text-center text-orange-600">
                → {!senderAddress ? 'Add sender address' : !recipientAddress ? 'Add recipient address' : 'Complete all fields'}
              </p>
            )}
            
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secure payment via Stripe</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSummaryCard;
