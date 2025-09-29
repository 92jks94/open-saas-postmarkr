import React from 'react';

interface PageBasedPricingDisplayProps {
  pageCount?: number;
  onPricingInfo?: (info: {
    tier: string;
    price: number;
    envelopeType: string;
    description: string;
  }) => void;
}

export function PageBasedPricingDisplay({ pageCount, onPricingInfo }: PageBasedPricingDisplayProps) {
  const getPricingInfo = (pages: number) => {
    if (pages <= 0) return null;
    if (pages > 60) return null;
    
    if (pages <= 5) {
      return {
        tier: 'tier_1',
        price: 2.50,
        envelopeType: 'standard_10_double_window',
        description: '1-5 pages - Standard #10 double-window envelope'
      };
    } else if (pages <= 20) {
      return {
        tier: 'tier_2',
        price: 7.50,
        envelopeType: 'flat_9x12_single_window',
        description: '6-20 pages - 9x12" flat single-window envelope'
      };
    } else {
      return {
        tier: 'tier_3',
        price: 15.00,
        envelopeType: 'flat_9x12_single_window',
        description: '21-60 pages - 9x12" flat single-window envelope'
      };
    }
  };

  const pricingInfo = pageCount ? getPricingInfo(pageCount) : null;

  React.useEffect(() => {
    if (pricingInfo && onPricingInfo) {
      onPricingInfo(pricingInfo);
    }
  }, [pricingInfo, onPricingInfo]);

  if (!pageCount) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <p className="text-gray-600 text-sm">Upload a document to see pricing</p>
      </div>
    );
  }

  if (pageCount > 60) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Document too large
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Documents with more than 60 pages are not supported. Please split your document into smaller parts.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!pricingInfo) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <p className="text-yellow-800 text-sm">Unable to determine pricing for this document</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            ${pricingInfo.price.toFixed(2)}
          </h3>
          <p className="text-sm text-gray-600">
            {pricingInfo.description}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {pageCount} page{pageCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">
            Envelope Type
          </div>
          <div className="text-sm font-medium text-gray-900">
            {pricingInfo.envelopeType === 'standard_10_double_window' 
              ? 'Standard #10' 
              : '9x12" Flat'
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default PageBasedPricingDisplay;
