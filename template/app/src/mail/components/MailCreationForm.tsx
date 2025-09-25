import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createMailPiece, getMailPiece } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Mail, Send, AlertTriangle, CheckCircle, CreditCard, ArrowLeft } from 'lucide-react';
import FileSelector from './FileSelector';
import AddressSelector from './AddressSelector';
import PaymentStep from './PaymentStep';
import type { MailPiece, MailAddress, File } from 'wasp/entities';

/**
 * Props for the MailCreationForm component
 */
export interface MailCreationFormProps {
  /** Callback fired when mail piece is successfully created and paid */
  onSuccess?: (mailPieceId: string) => void;
  /** Optional CSS classes for styling */
  className?: string;
}

/**
 * Form data structure for mail piece creation
 */
export interface FormData {
  /** Type of mail piece (postcard, letter, check, etc.) */
  mailType: string;
  /** USPS mail class (first_class, standard, express, priority) */
  mailClass: string;
  /** Physical dimensions (4x6, 6x9, etc.) */
  mailSize: string;
  /** UUID of selected sender address */
  senderAddressId: string | null;
  /** UUID of selected recipient address */
  recipientAddressId: string | null;
  /** UUID of selected file attachment (optional) */
  fileId: string | null;
  /** Optional description text */
  description: string;
  /** Printing preferences - for future use */
  colorPrinting: boolean;
  doubleSided: boolean;
}

// Mail size options based on mail type - SIMPLIFIED FOR LAUNCH: Only #10 envelope
const getMailSizeOptions = (mailType: string) => {
  const sizeOptions: Record<string, Array<{ value: string; label: string; description: string }>> = {
    'letter': [
      { value: '4x6', label: '#10 Envelope', description: 'Standard #10 business envelope (4⅛" × 9½")' }
    ],
    // COMMENTED OUT FOR LAUNCH - Will be re-enabled in future updates
    // 'postcard': [
    //   { value: '4x6', label: '4" × 6"', description: 'Standard postcard size' }
    // ],
    // 'letter': [
    //   { value: '6x9', label: '6" × 9"', description: 'Standard letter size' },
    //   { value: '6x11', label: '6" × 11"', description: 'Legal size letter' }
    // ],
    // 'check': [
    //   { value: '6x9', label: '6" × 9"', description: 'Standard check size' }
    // ],
    // 'self_mailer': [
    //   { value: '6x9', label: '6" × 9"', description: 'Standard self mailer' },
    //   { value: '6x11', label: '6" × 11"', description: 'Legal size self mailer' },
    //   { value: '6x18', label: '6" × 18"', description: 'Large self mailer' }
    // ],
    // 'catalog': [
    //   { value: '9x12', label: '9" × 12"', description: 'Standard catalog size' },
    //   { value: '12x15', label: '12" × 15"', description: 'Large catalog' },
    //   { value: '12x18', label: '12" × 18"', description: 'Extra large catalog' }
    // ],
    // 'booklet': [
    //   { value: '6x9', label: '6" × 9"', description: 'Standard booklet' },
    //   { value: '9x12', label: '9" × 12"', description: 'Large booklet' }
    // ]
  };

  return sizeOptions[mailType] || sizeOptions['letter'];
};

const MailCreationForm: React.FC<MailCreationFormProps> = ({
  onSuccess,
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    mailType: 'letter',
    mailClass: 'usps_first_class',
    mailSize: '4x6', // #10 envelope size
    senderAddressId: null,
    recipientAddressId: null,
    fileId: null,
    description: '',
    // Printing preferences - MVP defaults
    colorPrinting: false, // Default to black & white for MVP
    doubleSided: true,    // Default to double-sided for MVP
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  // Payment step state
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');
  const [createdMailPiece, setCreatedMailPiece] = useState<MailPiece & {
    senderAddress: MailAddress;
    recipientAddress: MailAddress;
    file?: File | null;
  } | null>(null);

  // Direct action call - no useAction hook needed

  // Mail type options - SIMPLIFIED FOR LAUNCH: Only letters
  const mailTypeOptions = [
    { value: 'letter', label: 'Letter', description: 'Standard letter format' },
    // COMMENTED OUT FOR LAUNCH - Will be re-enabled in future updates
    // { value: 'postcard', label: 'Postcard', description: 'Single-sided mail piece' },
    // { value: 'check', label: 'Check', description: 'Check or payment document' },
    // { value: 'self_mailer', label: 'Self Mailer', description: 'Self-contained mail piece' },
    // { value: 'catalog', label: 'Catalog', description: 'Multi-page catalog' },
    // { value: 'booklet', label: 'Booklet', description: 'Bound booklet format' }
  ];

  // Mail class options - SIMPLIFIED FOR LAUNCH: Only first class
  const mailClassOptions = [
    { value: 'usps_first_class', label: 'First Class', description: 'Fastest delivery, highest priority' },
    // COMMENTED OUT FOR LAUNCH - Will be re-enabled in future updates
    // { value: 'usps_standard', label: 'Standard', description: 'Economical option for bulk mail' },
    // { value: 'usps_express', label: 'Express', description: 'Overnight delivery' },
    // { value: 'usps_priority', label: 'Priority', description: '1-3 business days' }
  ];


  // Memoize form validation to prevent unnecessary re-computation
  const formValidation = useMemo(() => {
    const newErrors: Record<string, string> = {};

    if (!formData.senderAddressId) {
      newErrors.senderAddressId = 'Please select a sender address';
    }

    if (!formData.recipientAddressId) {
      newErrors.recipientAddressId = 'Please select a recipient address';
    }

    if (formData.senderAddressId === formData.recipientAddressId) {
      newErrors.recipientAddressId = 'Sender and recipient addresses must be different';
    }

    if (!formData.fileId) {
      newErrors.fileId = 'Please select a file to send';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    return {
      errors: newErrors,
      isValid: Object.keys(newErrors).length === 0
    };
  }, [formData.senderAddressId, formData.recipientAddressId, formData.fileId, formData.description]);

  // Update errors state when validation changes
  useEffect(() => {
    setErrors(formValidation.errors);
  }, [formValidation.errors]);

  // Validation function for form submission
  const validateForm = useCallback((): boolean => {
    return formValidation.isValid;
  }, [formValidation.isValid]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createMailPiece({
        mailType: formData.mailType,
        mailClass: formData.mailClass,
        mailSize: formData.mailSize,
        senderAddressId: formData.senderAddressId!,
        recipientAddressId: formData.recipientAddressId!,
        fileId: formData.fileId!,
        description: formData.description || undefined
      });

      // Fetch the complete mail piece with relations for payment step
      const completeMailPiece = await getMailPiece({ id: result.id });
      if (completeMailPiece) {
        setCreatedMailPiece(completeMailPiece);
        setCurrentStep('payment');
      } else {
        throw new Error('Failed to load mail piece details');
      }
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create mail piece');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (mailPieceId: string) => {
    if (onSuccess) {
      onSuccess(mailPieceId);
    }
  };

  // Handle payment cancellation
  const handlePaymentCancel = () => {
    setCurrentStep('form');
    setCreatedMailPiece(null);
  };

  // Go back to form step
  const handleBackToForm = () => {
    setCurrentStep('form');
    setCreatedMailPiece(null);
  };

  // Memoize size options to prevent recreation on every render
  const sizeOptions = useMemo(() => {
    return getMailSizeOptions(formData.mailType);
  }, [formData.mailType]);

  // Reset size when mail type changes
  useEffect(() => {
    if (sizeOptions.length > 0 && !sizeOptions.find(option => option.value === formData.mailSize)) {
      setFormData(prev => ({ ...prev, mailSize: sizeOptions[0].value }));
    }
  }, [formData.mailType, sizeOptions, formData.mailSize]);

  // Memoize form validity check
  const isFormValid = useMemo(() => {
    return formData.senderAddressId && 
           formData.recipientAddressId && 
           formData.fileId &&
           formData.senderAddressId !== formData.recipientAddressId;
  }, [formData.senderAddressId, formData.recipientAddressId, formData.fileId]);

  // Render payment step
  if (currentStep === 'payment' && createdMailPiece) {
    return (
      <div className={className}>
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={handleBackToForm}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Mail Configuration
          </Button>
          
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <span className="text-sm text-gray-600">Mail Created</span>
            </div>
            <div className="flex-1 h-px bg-gray-200"></div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                2
              </div>
              <span className="text-sm font-medium text-blue-600">Payment</span>
            </div>
          </div>
        </div>

        <PaymentStep
          mailPiece={createdMailPiece}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentCancel={handlePaymentCancel}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mail Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Mail Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mail Type */}
            <div className="space-y-2">
              <Label htmlFor="mailType">Mail Type</Label>
              <Select
                value={formData.mailType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mailType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mail type" />
                </SelectTrigger>
                <SelectContent>
                  {mailTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mail Class */}
            <div className="space-y-2">
              <Label htmlFor="mailClass">Mail Class</Label>
              <Select
                value={formData.mailClass}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mailClass: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mail class" />
                </SelectTrigger>
                <SelectContent>
                  {mailClassOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Mail Size */}
            <div className="space-y-2">
              <Label htmlFor="mailSize">Mail Size</Label>
              <Select
                value={formData.mailSize}
                onValueChange={(value) => setFormData(prev => ({ ...prev, mailSize: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select mail size" />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <div className="font-medium">{option.label}</div>
                        <div className="text-xs text-gray-500">{option.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Brief description of this mail piece..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                maxLength={500}
                rows={3}
              />
              <div className="text-xs text-gray-500">
                {formData.description.length}/500 characters
              </div>
              {errors.description && (
                <p className="text-xs text-red-600">{errors.description}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Address Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AddressSelector
            selectedAddressId={formData.senderAddressId}
            onAddressSelect={(addressId) => setFormData(prev => ({ ...prev, senderAddressId: addressId }))}
            addressType="sender"
          />
          
          <AddressSelector
            selectedAddressId={formData.recipientAddressId}
            onAddressSelect={(addressId) => setFormData(prev => ({ ...prev, recipientAddressId: addressId }))}
            addressType="recipient"
          />
        </div>

        {/* File Selection */}
        <FileSelector
          selectedFileId={formData.fileId}
          onFileSelect={(fileId) => setFormData(prev => ({ ...prev, fileId }))}
          mailType={formData.mailType}
          mailSize={formData.mailSize}
        />

        {/* TODO: Printing Preferences - Hidden for MVP, will be added in future update
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Printing Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="colorPrinting"
                checked={formData.colorPrinting}
                onChange={(e) => setFormData(prev => ({ ...prev, colorPrinting: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="colorPrinting">Color Printing (+$0.10 per page)</Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="doubleSided"
                checked={formData.doubleSided}
                onChange={(e) => setFormData(prev => ({ ...prev, doubleSided: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="doubleSided">Double-sided printing</Label>
            </div>
          </CardContent>
        </Card>
        */}

        {/* Error Display */}
        {Object.keys(errors).length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please fix the following errors:
              <ul className="mt-2 list-disc list-inside">
                {Object.entries(errors).map(([field, error]) => (
                  <li key={field}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {submitError && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Creating...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Create & Pay
              </>
            )}
          </Button>
        </div>

        {/* Form Status */}
        {isFormValid && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Ready to create mail piece and proceed to payment</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default MailCreationForm;
