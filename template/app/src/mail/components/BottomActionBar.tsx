import React from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CheckCircle, AlertTriangle, CreditCard, FileText, Mail, DollarSign } from 'lucide-react';
import { getPricingTierForPageCount } from '../../shared/constants/pricing';

export interface BottomActionBarProps {
  /** Whether the form is valid and ready to submit */
  isValid: boolean;
  /** Whether the form is currently submitting */
  isSubmitting: boolean;
  /** Number of pages in the document */
  pageCount?: number;
  /** Mail class (e.g., "usps_first_class") */
  mailClass: string;
  /** Mail type (e.g., "letter") */
  mailType: string;
  /** Address placement option */
  addressPlacement: 'top_first_page' | 'insert_blank_page';
  /** Callback when submit button is clicked (can be form submit or button click) */
  onSubmit: (e?: React.FormEvent | React.MouseEvent) => void;
  /** Optional validation errors to display */
  errors?: Record<string, string>;
  /** Whether a file has been selected */
  fileSelected: boolean;
  /** Whether both sender and recipient addresses have been selected */
  addressesSelected: boolean;
}

/**
 * BottomActionBar - Sticky footer with summary and call-to-action
 * 
 * Features:
 * - Sticky positioning (bottom-0, only visible when scrolled)
 * - Summary: pages, mail class, calculated price
 * - Submit button with loading state
 * - Validation status indicator
 * - Responsive: Stacks vertically on mobile
 */
export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  isValid,
  isSubmitting,
  pageCount,
  mailClass,
  mailType,
  addressPlacement,
  onSubmit,
  errors = {},
  fileSelected,
  addressesSelected
}) => {
  // Calculate total pages (including address page if needed)
  const totalPages = pageCount 
    ? (addressPlacement === 'insert_blank_page' ? pageCount + 1 : pageCount)
    : 0;

  // Get pricing information
  const pricingTier = totalPages > 0 ? getPricingTierForPageCount(totalPages) : null;

  // Format mail class for display
  const formatMailClass = (mailClass: string) => {
    return mailClass
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const errorCount = Object.keys(errors).length;

  // Determine dynamic step message and progress
  const getStepMessage = () => {
    if (!fileSelected) return 'Select File';
    if (!addressesSelected) return 'Select Addresses';
    if (isValid) return 'Ready to Send';
    return 'Complete Form';
  };

  // Calculate progress dots (filled vs unfilled)
  const getProgressDots = (): boolean[] => {
    const dots: boolean[] = [];
    const step1Complete = fileSelected;
    const step2Complete = addressesSelected;
    const step3Complete = isValid;

    dots.push(step1Complete);
    dots.push(step2Complete);
    dots.push(step3Complete);

    return dots;
  };

  const stepMessage = getStepMessage();
  const progressDots = getProgressDots();

  return (
    <div className="sticky bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop Layout */}
        <div className="hidden md:flex items-center justify-between gap-4">
          {/* Left: Status and Summary */}
          <div className="flex items-center gap-4">
            {/* Dynamic Step Message with Progress Dots */}
            <div className="flex items-center gap-2">
              <span className={`font-medium text-sm ${isValid ? 'text-green-600' : 'text-gray-900'}`}>
                {stepMessage}
              </span>
              <div className="flex items-center gap-1">
                {progressDots.map((isFilled, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      isFilled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Summary Items */}
            {totalPages > 0 && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2 text-gray-700">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">{totalPages} page{totalPages !== 1 ? 's' : ''}</span>
                </div>
              </>
            )}

            {mailClass && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-sm">{formatMailClass(mailClass)}</span>
                </div>
              </>
            )}

            {pricingTier && (
              <>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-2 text-gray-700">
                  <DollarSign className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-semibold">${pricingTier.priceInDollars.toFixed(2)}</span>
                </div>
              </>
            )}
          </div>

          {/* Right: Submit Button */}
          <Button
            type="button"
            onClick={(e) => onSubmit(e)}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            loadingText="Creating..."
            size="lg"
            className="min-w-[200px]"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Continue to Payment
          </Button>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-3">
          {/* Status */}
          <div className="flex items-center justify-between">
            {/* Dynamic Step Message with Progress Dots */}
            <div className="flex items-center gap-2">
              <span className={`font-medium text-sm ${isValid ? 'text-green-600' : 'text-gray-900'}`}>
                {stepMessage}
              </span>
              <div className="flex items-center gap-1">
                {progressDots.map((isFilled, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      isFilled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Price */}
            {pricingTier && (
              <div className="flex items-center gap-1 text-gray-700">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-semibold">${pricingTier.priceInDollars.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Summary Info */}
          {totalPages > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <Badge variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {totalPages} page{totalPages !== 1 ? 's' : ''}
              </Badge>
              {mailClass && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {formatMailClass(mailClass)}
                </Badge>
              )}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="button"
            onClick={(e) => onSubmit(e)}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            loadingText="Creating..."
            size="lg"
            className="w-full"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Continue to Payment
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BottomActionBar;

