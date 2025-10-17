import React from 'react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CheckCircle, AlertTriangle, CreditCard, FileText, Mail, DollarSign, ArrowRight, Send, Save, Check, Clock, Package, Shield } from 'lucide-react';
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
  /** Callback for saving draft */
  onSaveDraft: () => void;
  /** Whether the draft is currently saving */
  isSaving: boolean;
  /** Last saved timestamp */
  lastSaved: Date | null;
}

/**
 * BottomActionBar - Sticky footer with summary and call-to-action
 * 
 * Features:
 * - Sticky positioning at bottom
 * - Save Draft button with auto-save indicator
 * - Pricing display
 * - Submit button with trust signals
 * - Responsive layout
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
  addressesSelected,
  onSaveDraft,
  isSaving,
  lastSaved
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

  // Format time ago for last saved
  const getTimeAgo = (date: Date | null) => {
    if (!date) return null;
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 10) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="lg:hidden sticky bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Desktop Layout: Hidden on large screens (lg:hidden above) */}
        <div className="hidden md:flex lg:hidden items-center justify-between gap-6">
          {/* Left: Auto-save Indicator Only */}
          <div className="flex items-center gap-2">
            {isSaving ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Save className="h-3.5 w-3.5 animate-pulse" />
                <span>Saving...</span>
              </div>
            ) : lastSaved ? (
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Check className="h-3.5 w-3.5 text-green-600" />
                <span>Saved {getTimeAgo(lastSaved)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <Save className="h-3.5 w-3.5" />
                <span>Auto-save enabled</span>
              </div>
            )}
          </div>

          {/* Center: Trust Signals + Price */}
          <div className="flex items-center gap-4">
            {/* Trust Signals - Compact */}
            <div className="flex items-center gap-3 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-blue-600" />
                <span>1-3 days</span>
              </div>
              <div className="flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-blue-600" />
                <span>Tracking</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>Secure</span>
              </div>
            </div>

            {/* Price Display */}
            {pricingTier && (
              <>
                <div className="h-8 w-px bg-gray-300" />
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">Total:</span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${pricingTier.priceInDollars.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Right: Submit CTA */}
          <Button
            type="button"
            onClick={(e) => onSubmit(e)}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            loadingText="Sending..."
            size="lg"
            className="min-w-[220px] bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all text-base"
          >
            {pricingTier ? (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send My Mail Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Form First
              </>
            )}
          </Button>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden space-y-2.5">
          {/* Top Row: Auto-save Status + Price */}
          <div className="flex items-center justify-between">
            {/* Auto-save Indicator */}
            <div className="flex items-center gap-1.5 text-xs">
              {isSaving ? (
                <>
                  <Save className="h-3.5 w-3.5 animate-pulse text-gray-500" />
                  <span className="text-gray-500">Saving...</span>
                </>
              ) : lastSaved ? (
                <>
                  <Check className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-gray-500">Saved</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-gray-400">Auto-save</span>
                </>
              )}
            </div>

            {/* Price Badge */}
            {pricingTier && (
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-600">Total:</span>
                <span className="text-lg font-bold text-gray-900">
                  ${pricingTier.priceInDollars.toFixed(2)}
                </span>
              </div>
            )}
          </div>

          {/* Trust Signals Row */}
          <div className="flex items-center justify-center gap-3 text-xs text-gray-600 py-1 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-blue-600" />
              <span>1-3 days</span>
            </div>
            <div className="flex items-center gap-1">
              <Package className="h-3 w-3 text-blue-600" />
              <span>Tracking</span>
            </div>
            <div className="flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-600" />
              <span>Secure</span>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="button"
            onClick={(e) => onSubmit(e)}
            disabled={!isValid || isSubmitting}
            isLoading={isSubmitting}
            loadingText="Sending..."
            size="lg"
            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            {pricingTier ? (
              <>
                <Send className="h-5 w-5 mr-2" />
                Send My Mail Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Complete Form First
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BottomActionBar;

