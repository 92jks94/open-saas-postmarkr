import React, { useMemo } from 'react';
import { 
  Receipt, 
  MapPin, 
  Settings, 
  DollarSign, 
  ArrowDown, 
  Loader2, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CompactPDFViewer } from './CompactPDFViewer';
import type { File, MailAddress } from 'wasp/entities';
import { getPricingTierForPageCount } from '../../shared/constants/pricing';
import { formatFileSize } from '../../file-upload/validation';

interface OrderSummaryCardProps {
  selectedFile: File | null;
  senderAddress: MailAddress | null;
  recipientAddress: MailAddress | null;
  mailType: string;
  mailClass: string;
  mailSize: string;
  addressPlacement: 'top_first_page' | 'insert_blank_page';
  isValid: boolean;
  onSubmit: () => void;
  isSubmitting: boolean;
  fileId: string | null;
  senderAddressId: string | null;
  recipientAddressId: string | null;
}

const getMailTypeDisplay = (mailType: string) => {
  const types: Record<string, string> = {
    'letter': 'Letter',
    'postcard': 'Postcard',
    'check': 'Check',
  };
  return types[mailType] || mailType;
};

const getMailClassDisplay = (mailClass: string) => {
  const classes: Record<string, string> = {
    'usps_first_class': 'First Class',
    'usps_express': 'Express',
    'usps_priority': 'Priority',
  };
  return classes[mailClass] || mailClass;
};

export const OrderSummaryCard: React.FC<OrderSummaryCardProps> = ({
  selectedFile,
  senderAddress,
  recipientAddress,
  mailType,
  mailClass,
  mailSize,
  addressPlacement,
  isValid,
  onSubmit,
  isSubmitting,
  fileId,
  senderAddressId,
  recipientAddressId,
}) => {
  const isPDF = selectedFile?.type === 'application/pdf';

  // Calculate pricing
  const pricingTier = useMemo(() => {
    if (!selectedFile?.pageCount) return null;
    
    const pageCount = selectedFile.pageCount;
    const effectivePageCount = addressPlacement === 'insert_blank_page' ? pageCount + 1 : pageCount;
    
    return getPricingTierForPageCount(effectivePageCount);
  }, [selectedFile?.pageCount, addressPlacement]);

  const totalPages = useMemo(() => {
    if (!selectedFile?.pageCount) return 0;
    return addressPlacement === 'insert_blank_page' 
      ? selectedFile.pageCount + 1 
      : selectedFile.pageCount;
  }, [selectedFile?.pageCount, addressPlacement]);

  return (
    <Card className="lg:sticky lg:top-6 shadow-lg">
      <CardHeader className="border-b bg-muted/30">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Receipt className="h-5 w-5" />
          Order Summary
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6 p-6">
        {/* Document Preview */}
        {selectedFile ? (
          <div className="pb-6 border-b">
            <div className="flex gap-3">
              {isPDF ? (
                <CompactPDFViewer 
                  fileKey={selectedFile.key}
                  className="flex-shrink-0"
                  maxWidth={180}
                  maxHeight={240}
                />
              ) : (
                <div className="w-20 h-24 bg-red-50 rounded border flex items-center justify-center flex-shrink-0">
                  <FileText className="h-8 w-8 text-red-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedFile.pageCount ? `${selectedFile.pageCount} pages` : 'Processing...'}
                  {selectedFile.size ? ` • ${formatFileSize(selectedFile.size)}` : ''}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-6 border-b">
            <div className="text-center py-6 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No file selected</p>
            </div>
          </div>
        )}
        
        {/* Addresses */}
        {(senderAddress || recipientAddress) && (
          <div className="space-y-3 pb-6 border-b">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <MapPin className="h-3 w-3" />
              <span>Delivery Route</span>
            </div>
            
            {senderAddress ? (
              <div>
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium text-sm">{senderAddress.contactName}</p>
                <p className="text-xs text-muted-foreground">
                  {senderAddress.address_city}, {senderAddress.address_state}
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">No sender address</div>
            )}
            
            {senderAddress && recipientAddress && (
              <div className="flex justify-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            
            {recipientAddress ? (
              <div>
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-medium text-sm">{recipientAddress.contactName}</p>
                <p className="text-xs text-muted-foreground">
                  {recipientAddress.address_city}, {recipientAddress.address_state}
                </p>
              </div>
            ) : senderAddress ? (
              <div className="text-sm text-muted-foreground">No recipient address</div>
            ) : null}
          </div>
        )}
        
        {/* Mail Configuration */}
        {mailType && (
          <div className="pb-6 border-b">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <Settings className="h-3 w-3" />
              <span>Mail Configuration</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium">{getMailTypeDisplay(mailType)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Class:</span>
                <p className="font-medium">{getMailClassDisplay(mailClass)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Size:</span>
                <p className="font-medium">{mailSize}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Address:</span>
                <p className="font-medium text-xs">
                  {addressPlacement === 'insert_blank_page' ? 'Insert Page' : 'Top of Page'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Cost Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Cost Breakdown</span>
          </div>
          
          {pricingTier && selectedFile?.pageCount ? (
            <>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document Pages:</span>
                  <span className="font-medium">{selectedFile.pageCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address Placement:</span>
                  <span className="font-medium">
                    {addressPlacement === 'insert_blank_page' ? '+1 page' : 'Top of page'}
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>Total Pages to Mail:</span>
                  <span>{totalPages}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="text-xs text-muted-foreground mb-1">Envelope Type</div>
                <div className="text-sm font-medium">{pricingTier.description}</div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-base">Total Cost:</span>
                  <span className="text-2xl font-bold text-green-600">
                    ${pricingTier.priceInDollars.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-4 text-center">
              {!selectedFile ? 'Select a file to calculate cost' : 'Calculating...'}
            </div>
          )}
        </div>
      </CardContent>
      
      {/* Payment CTA - Footer */}
      <CardFooter className="border-t bg-muted/30 p-4">
        <div className="space-y-3 w-full">
          <Button
            onClick={onSubmit}
            disabled={!isValid || isSubmitting}
            className="w-full h-12 text-base font-semibold"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : isValid && pricingTier ? (
              <>
                Continue to Payment
                <span className="ml-2 font-bold">
                  ${pricingTier.priceInDollars.toFixed(2)}
                </span>
              </>
            ) : (
              'Complete Form to Continue'
            )}
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            <span>Secure payment via Stripe</span>
          </div>
          
          {!isValid && (
            <div className="text-xs text-center text-muted-foreground space-y-1">
              {!fileId && <div>→ Select a file to continue</div>}
              {fileId && !senderAddressId && <div>→ Add sender address</div>}
              {senderAddressId && !recipientAddressId && <div>→ Add recipient address</div>}
            </div>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

