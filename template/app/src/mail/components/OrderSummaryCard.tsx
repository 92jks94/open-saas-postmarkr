import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { 
  Receipt, 
  FileText, 
  MapPin, 
  Mail, 
  ArrowRight,
  ShieldCheck,
  Clock,
  Shield,
  Package
} from 'lucide-react';
import type { File, MailAddress } from 'wasp/entities';
import { getPricingTierForPageCount } from '../../shared/constants/pricing';
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
 * - File information (name and page count only)
 * - Sender/Recipient delivery route
 * - Mail configuration summary
 * - Cost breakdown with trust signals
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
          {/* File Information - Scannable Box */}
          {selectedFile ? (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
              <FileText className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-600 font-medium">Document</p>
                <p className="text-xs text-gray-900 truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
              </div>
              <Badge variant="secondary" className="text-xs font-bold flex-shrink-0">
                {selectedFile.pageCount}p
              </Badge>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-dashed border-gray-200">
              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <p className="text-xs text-gray-500">No file</p>
            </div>
          )}

          {/* Delivery Route - Scannable */}
          <div className="space-y-2">
            {senderAddress ? (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 font-medium">From</p>
                  <p className="text-xs text-gray-900 truncate" title={senderAddress.contactName}>
                    {senderAddress.contactName}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-dashed border-gray-200">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500">No sender</p>
              </div>
            )}
            
            {recipientAddress ? (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
                <MapPin className="h-4 w-4 text-gray-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-600 font-medium">To</p>
                  <p className="text-xs text-gray-900 truncate" title={recipientAddress.contactName}>
                    {recipientAddress.contactName}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-dashed border-gray-200">
                <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs text-gray-500">No recipient</p>
              </div>
            )}
          </div>

          {/* Mail Configuration - Single Line */}
          {pricingInfo && (
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
              <Mail className="h-4 w-4 text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-900 truncate">
                  <span className="text-gray-600 font-medium">Config</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="capitalize">{mailConfig.mailType}</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span>{formatMailClass(mailConfig.mailClass)}</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span>{pricingInfo.totalPages}p</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span>{pricingInfo.pricingTier?.description.split(' - ')[0]}</span>
                </p>
              </div>
            </div>
          )}

          {/* Cost Breakdown */}
          {pricingInfo && pricingInfo.pricingTier && (
            <div className="border-t-2 border-gray-200 pt-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-900">Total:</span>
                <span className="text-3xl font-bold text-green-600">
                  ${pricingInfo.pricingTier.priceInDollars.toFixed(2)}
                </span>
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                Includes all: print • envelope • postage • tracking
              </p>
            </div>
          )}

          {!pricingInfo && selectedFile && (
            <div className="text-center py-3 px-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Select a file to calculate cost</p>
            </div>
          )}

          {/* Trust Signals - Desktop Only */}
          {pricingInfo && (
            <div className="hidden lg:block space-y-2 text-xs bg-gray-50 rounded-lg p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-gray-700">
                <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>Mails in 1-3 business days</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Package className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>USPS tracking included</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                <span>100% satisfaction guarantee</span>
              </div>
            </div>
          )}

          {/* Submit Button - Always visible now */}
          <div className="pt-3 border-t space-y-3">
            <Button
              onClick={onSubmit}
              disabled={!isValid || isSubmitting}
              isLoading={isSubmitting}
              loadingText="Creating..."
              size="lg"
              className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              {pricingInfo ? (
                <>
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Send My Mail Now
                  <Badge variant="secondary" className="ml-2 bg-white text-green-700 font-bold">
                    ${pricingInfo.pricingTier?.priceInDollars.toFixed(2)}
                  </Badge>
                </>
              ) : (
                'Complete Form to Continue'
              )}
            </Button>

            {!isValid && selectedFile && (
              <p className="text-xs text-center text-orange-600 font-medium">
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
