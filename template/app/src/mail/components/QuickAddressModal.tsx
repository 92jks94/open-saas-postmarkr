import React, { useState, FormEvent } from 'react';
import { createMailAddress } from 'wasp/client/operations';
import type { MailAddress } from 'wasp/entities';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { SimpleAddressValidator, ADDRESS_TYPES, SUPPORTED_COUNTRIES } from '../../shared/addressValidationSimple';
import { cn } from '../../lib/utils';

/**
 * Helper to get readable country name from country code
 */
const getCountryName = (code: string): string => {
  const countryNames: Record<string, string> = {
    'US': 'United States',
    'CA': 'Canada',
    'GB': 'United Kingdom',
    'AU': 'Australia',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland'
  };
  return countryNames[code] || code;
};

/**
 * Props for the QuickAddressModal component
 */
interface QuickAddressModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback fired when address is successfully created */
  onSuccess: (address: MailAddress) => void;
  /** Type of address (sender or recipient) */
  addressType: 'sender' | 'recipient';
}

/**
 * QuickAddressModal - Inline address creation modal
 * Extracted from AddressManagementPage for reuse in mail creation flow
 */
export const QuickAddressModal: React.FC<QuickAddressModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  addressType
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState<string>('US');

  // Clear field error when user starts typing
  const clearFieldError = (fieldName: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
    setAddressError(null);
  };

  // Get country-specific validation rules
  const getCountryRules = () => SimpleAddressValidator.getCountryRules(selectedCountry);

  // Validate form using SimpleAddressValidator
  const validateForm = (formData: FormData): { isValid: boolean; errors: Record<string, string> } => {
    const addressData = {
      contactName: formData.get('contactName') as string || '',
      companyName: formData.get('companyName') as string || '',
      address_line1: formData.get('address_line1') as string || '',
      address_line2: formData.get('address_line2') as string || '',
      address_city: formData.get('address_city') as string || '',
      address_state: formData.get('address_state') as string || '',
      address_zip: formData.get('address_zip') as string || '',
      address_country: formData.get('address_country') as string || '',
      label: formData.get('label') as string || '',
      addressType: formData.get('addressType') as string || 'both',
    };

    return SimpleAddressValidator.validateAddress(addressData);
  };

  // Address creation handler
  const handleCreateAddress = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setIsCreating(true);
      setAddressError(null);
      setFormErrors({});

      const formElement = e.target;
      if (!(formElement instanceof HTMLFormElement)) {
        throw new Error('Event target is not a form element');
      }

      const formData = new FormData(formElement);
      
      // Validate form
      const validationResult = validateForm(formData);
      if (!validationResult.isValid) {
        setFormErrors(validationResult.errors);
        setIsCreating(false);
        return;
      }
      
      const addressTypeValue = formData.get('addressType') as string || addressType;
      const validAddressTypes = ['sender', 'recipient', 'both'] as const;
      const finalAddressType = validAddressTypes.includes(addressTypeValue as any) 
        ? (addressTypeValue as 'sender' | 'recipient' | 'both')
        : addressType;

      const addressData = {
        contactName: formData.get('contactName') as string,
        companyName: formData.get('companyName') as string || undefined,
        address_line1: formData.get('address_line1') as string,
        address_line2: formData.get('address_line2') as string ?? undefined,
        address_city: formData.get('address_city') as string,
        address_state: formData.get('address_state') as string,
        address_zip: formData.get('address_zip') as string,
        address_country: formData.get('address_country') as string,
        label: formData.get('label') as string || undefined,
        addressType: finalAddressType,
      };

      const newAddress = await createMailAddress(addressData);
      
      // Reset form and call success callback
      formElement.reset();
      onSuccess(newAddress);
      onClose();
    } catch (error) {
      console.error('Error creating address:', error);
      setAddressError(
        error instanceof Error ? error.message : 'An unexpected error occurred while creating the address.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const countryRules = getCountryRules();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add {addressType === 'sender' ? 'Sender' : 'Recipient'} Address</DialogTitle>
          <DialogDescription>
            Create a new address to use for this mail piece. It will be saved for future use.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateAddress} className="space-y-4">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contactName">
                Contact Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactName"
                name="contactName"
                placeholder="John Doe"
                required
                onChange={() => clearFieldError('contactName')}
                className={cn(formErrors.contactName && 'border-red-500')}
              />
              {formErrors.contactName && (
                <p className="text-xs text-red-600">{formErrors.contactName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                name="companyName"
                placeholder="Acme Corp (optional)"
                onChange={() => clearFieldError('companyName')}
              />
            </div>
          </div>

          {/* Address Lines */}
          <div className="space-y-2">
            <Label htmlFor="address_line1">
              Address Line 1 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address_line1"
              name="address_line1"
              placeholder="123 Main Street"
              required
              onChange={() => clearFieldError('address_line1')}
              className={cn(formErrors.address_line1 && 'border-red-500')}
            />
            {formErrors.address_line1 && (
              <p className="text-xs text-red-600">{formErrors.address_line1}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2</Label>
            <Input
              id="address_line2"
              name="address_line2"
              placeholder="Apt 4B (optional)"
              onChange={() => clearFieldError('address_line2')}
            />
          </div>

          {/* City, State, ZIP, Country */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address_city">
                City <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address_city"
                name="address_city"
                placeholder="San Francisco"
                required
                onChange={() => clearFieldError('address_city')}
                className={cn(formErrors.address_city && 'border-red-500')}
              />
              {formErrors.address_city && (
                <p className="text-xs text-red-600">{formErrors.address_city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_state">
                {countryRules.stateLabel} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address_state"
                name="address_state"
                placeholder={countryRules.statePlaceholder}
                maxLength={countryRules.stateMaxLength}
                required
                onChange={() => clearFieldError('address_state')}
                className={cn(formErrors.address_state && 'border-red-500')}
              />
              {formErrors.address_state && (
                <p className="text-xs text-red-600">{formErrors.address_state}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address_zip">
                {countryRules.zipLabel} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address_zip"
                name="address_zip"
                placeholder={countryRules.zipPlaceholder}
                required
                onChange={() => clearFieldError('address_zip')}
                className={cn(formErrors.address_zip && 'border-red-500')}
              />
              {formErrors.address_zip && (
                <p className="text-xs text-red-600">{formErrors.address_zip}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address_country">
                Country <span className="text-red-500">*</span>
              </Label>
              <Select 
                name="address_country" 
                defaultValue="US"
                onValueChange={setSelectedCountry}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_COUNTRIES.map(countryCode => (
                    <SelectItem key={countryCode} value={countryCode}>
                      {getCountryName(countryCode)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Optional Fields */}
          <div className="space-y-2">
            <Label htmlFor="label">Label (Optional)</Label>
            <Input
              id="label"
              name="label"
              placeholder="e.g., Home, Office, etc."
            />
          </div>

          {/* Address Type - Default to the type passed in */}
          <input type="hidden" name="addressType" value={addressType} />

          {/* Error Display */}
          {addressError && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{addressError}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Address'
              )}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickAddressModal;

