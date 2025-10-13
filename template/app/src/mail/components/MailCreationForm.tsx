import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createMailPiece, getMailPiece, getAllFilesByUser, useQuery } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { ArrowLeft, CheckCircle, CreditCard } from 'lucide-react';
import FileSelector from './FileSelector';
import AddressSelector from './AddressSelector';
import PaymentStep from './PaymentStep';
import QuickAddressModal from './QuickAddressModal';
import PDFViewer from './PDFViewer';
import BottomActionBar from './BottomActionBar';
import MailConfigurationSection from './MailConfigurationSection';
import type { MailPiece, MailAddress, File } from 'wasp/entities';
import { SimpleAddressValidator } from '../../shared/addressValidationSimple';

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
  /** Address placement preference */
  addressPlacement: 'top_first_page' | 'insert_blank_page';
}


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
    addressPlacement: 'insert_blank_page', // Default to insert_blank_page
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

  // Quick add modal state
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  // Fetch user's files to get selected file details
  const { data: userFiles, isLoading: filesLoading } = useQuery(getAllFilesByUser);
  
  // Find selected file for PDF viewer
  const selectedFile = useMemo(() => {
    if (!formData.fileId || !userFiles) {
      return null;
    }
    const file = userFiles.find((f: File) => f.id === formData.fileId) || null;
    if (process.env.NODE_ENV === 'development') {
      console.log('[MailCreationForm] Selected file:', { 
        fileId: formData.fileId, 
        found: !!file,
        hasKey: !!file?.key
      });
    }
    return file;
  }, [formData.fileId, userFiles]);

  // Determine if we should show the two-column layout
  const shouldShowTwoColumn = !!(selectedFile && selectedFile.key);

  // Direct action call - no useAction hook needed


  // Simplified form validation using only Zod validation
  const formValidation = useMemo(() => {
    const mailCreationData = {
      senderAddressId: formData.senderAddressId || '',
      recipientAddressId: formData.recipientAddressId || '',
      fileId: formData.fileId || '',
      description: formData.description || '',
    };

    const validation = SimpleAddressValidator.validateMailCreation(mailCreationData);
    
    // Customize error messages to be more user-friendly
    const customErrors: Record<string, string> = {};
    if (validation.errors.senderAddressId) {
      customErrors.senderAddressId = 'Please select a sender address';
    }
    if (validation.errors.recipientAddressId) {
      customErrors.recipientAddressId = 'Please select a recipient address';
    }
    if (validation.errors.fileId) {
      customErrors.fileId = 'Please select a file to send';
    }
    if (validation.errors.description) {
      customErrors.description = validation.errors.description;
    }
    
    return {
      isValid: validation.isValid,
      errors: Object.keys(customErrors).length > 0 ? customErrors : validation.errors
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

  // Shared submit logic - prevents duplication and race conditions
  const submitMailPiece = async () => {
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
        description: formData.description || undefined,
        addressPlacement: formData.addressPlacement
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    await submitMailPiece();
  };

  // Handle submit from bottom action bar (non-form event)
  const handleBottomBarSubmit = (e?: React.FormEvent | React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    submitMailPiece();
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

  // Memoized form update handler to prevent unnecessary re-renders
  const handleFormDataChange = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Simplified form validity check using Zod validation
  const isFormValid = useMemo(() => {
    return formValidation.isValid;
  }, [formValidation.isValid]);

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
        {/* File Selection - Always at top */}
        <FileSelector
          selectedFileId={formData.fileId}
          onFileSelect={(fileId) => setFormData(prev => ({ ...prev, fileId }))}
          mailType={formData.mailType}
          mailSize={formData.mailSize}
          addressPlacement={formData.addressPlacement}
          showPreview={false}
          compact={true}
        />

        {/* Two-Column Layout: PDF Viewer + Form Elements */}
        {shouldShowTwoColumn ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_500px] gap-6">
            {/* LEFT COLUMN: PDF Viewer */}
            <div className="w-full">
              <PDFViewer 
                fileKey={selectedFile.key}
              />
            </div>

            {/* RIGHT COLUMN: Address Selection + Mail Config */}
            <div className="space-y-6">
              {/* Address Selection */}
              <div className="space-y-6">
                <AddressSelector
                  selectedAddressId={formData.senderAddressId}
                  onAddressSelect={(addressId) => setFormData(prev => ({ ...prev, senderAddressId: addressId }))}
                  addressType="sender"
                  onQuickAdd={() => setShowSenderModal(true)}
                />
                
                <AddressSelector
                  selectedAddressId={formData.recipientAddressId}
                  onAddressSelect={(addressId) => setFormData(prev => ({ ...prev, recipientAddressId: addressId }))}
                  addressType="recipient"
                  onQuickAdd={() => setShowRecipientModal(true)}
                />
              </div>

              {/* Mail Configuration - Compact mode */}
              <MailConfigurationSection
                formData={{
                  mailType: formData.mailType,
                  mailClass: formData.mailClass,
                  mailSize: formData.mailSize,
                  description: formData.description,
                  addressPlacement: formData.addressPlacement
                }}
                onChange={handleFormDataChange}
                compact={true}
                errors={errors}
              />
            </div>
          </div>

          {/* Sticky Bottom Action Bar - Shows only in two-column layout */}
          <BottomActionBar
            isValid={isFormValid}
            isSubmitting={isSubmitting}
            pageCount={selectedFile?.pageCount || 0}
            mailClass={formData.mailClass}
            mailType={formData.mailType}
            addressPlacement={formData.addressPlacement}
            onSubmit={handleBottomBarSubmit}
            errors={errors}
            fileSelected={!!formData.fileId}
            addressesSelected={!!(formData.senderAddressId && formData.recipientAddressId)}
          />
          </>
        ) : (
          /* Single Column: No file selected yet - show original layout */
          <div className="space-y-6">
            {/* Address Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AddressSelector
                selectedAddressId={formData.senderAddressId}
                onAddressSelect={(addressId) => setFormData(prev => ({ ...prev, senderAddressId: addressId }))}
                addressType="sender"
                onQuickAdd={() => setShowSenderModal(true)}
              />
              
              <AddressSelector
                selectedAddressId={formData.recipientAddressId}
                onAddressSelect={(addressId) => setFormData(prev => ({ ...prev, recipientAddressId: addressId }))}
                addressType="recipient"
                onQuickAdd={() => setShowRecipientModal(true)}
              />
            </div>

            {/* Mail Configuration */}
            <MailConfigurationSection
              formData={{
                mailType: formData.mailType,
                mailClass: formData.mailClass,
                mailSize: formData.mailSize,
                description: formData.description,
                addressPlacement: formData.addressPlacement
              }}
              onChange={handleFormDataChange}
              errors={errors}
            />

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={isSubmitting}
                loadingText="Creating..."
                disabled={!isFormValid}
                className="min-w-[200px]"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Create & Pay
              </Button>
            </div>

            {/* Form Status */}
            {isFormValid && (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Ready to create mail piece and proceed to payment</span>
              </div>
            )}
          </div>
        )}
      </form>

      {/* Quick Add Address Modals */}
      <QuickAddressModal
        isOpen={showSenderModal}
        onClose={() => setShowSenderModal(false)}
        onSuccess={(address) => {
          setFormData(prev => ({ ...prev, senderAddressId: address.id }));
          setShowSenderModal(false);
        }}
        addressType="sender"
      />
      
      <QuickAddressModal
        isOpen={showRecipientModal}
        onClose={() => setShowRecipientModal(false)}
        onSuccess={(address) => {
          setFormData(prev => ({ ...prev, recipientAddressId: address.id }));
          setShowRecipientModal(false);
        }}
        addressType="recipient"
      />
    </div>
  );
};

export default MailCreationForm;
