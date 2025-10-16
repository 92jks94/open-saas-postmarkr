import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createMailPiece, createMailCheckoutSession, getAllFilesByUser, getMailAddressesByUser, useQuery } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { FileText } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import FileSelector from './FileSelector';
import AddressSelector from './AddressSelector';
import QuickAddressModal from './QuickAddressModal';
import MailConfigurationSection from './MailConfigurationSection';
import { CompactAddressSection } from './CompactAddressSection';
import { OrderSummaryCard } from './OrderSummaryCard';
import { QuickFileUpload } from './QuickFileUpload';
import type { MailAddress, File } from 'wasp/entities';
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
  
  // Smart progressive form state
  const [activeSection, setActiveSection] = useState<'file' | 'sender' | 'recipient' | 'config' | 'complete'>('file');

  // Quick add modal state
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  // Fetch user's files and addresses
  const { data: userFiles, isLoading: filesLoading } = useQuery(getAllFilesByUser);
  const { data: userAddresses, isLoading: addressesLoading } = useQuery(getMailAddressesByUser);
  
  // Find selected file
  const selectedFile = useMemo(() => {
    if (!formData.fileId || !userFiles) {
      return null;
    }
    return userFiles.find((f: File) => f.id === formData.fileId) || null;
  }, [formData.fileId, userFiles]);

  // Find selected addresses
  const senderAddress = useMemo(() => {
    if (!formData.senderAddressId || !userAddresses) {
      return null;
    }
    return userAddresses.find((a: MailAddress) => a.id === formData.senderAddressId) || null;
  }, [formData.senderAddressId, userAddresses]);

  const recipientAddress = useMemo(() => {
    if (!formData.recipientAddressId || !userAddresses) {
      return null;
    }
    return userAddresses.find((a: MailAddress) => a.id === formData.recipientAddressId) || null;
  }, [formData.recipientAddressId, userAddresses]);

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

  // Smart progression logic - auto-advance sections
  useEffect(() => {
    if (!formData.fileId) {
      setActiveSection('file');
    } else if (!formData.senderAddressId) {
      setActiveSection('sender');
    } else if (!formData.recipientAddressId) {
      setActiveSection('recipient');
    } else if (formData.fileId && formData.senderAddressId && formData.recipientAddressId) {
      setActiveSection('config');
    }
  }, [formData.fileId, formData.senderAddressId, formData.recipientAddressId]);

  // Mark form as complete when valid
  useEffect(() => {
    if (formValidation.isValid && activeSection === 'config') {
      setActiveSection('complete');
    }
  }, [formValidation.isValid, activeSection]);

  // Validation function for form submission
  const validateForm = useCallback((): boolean => {
    return formValidation.isValid;
  }, [formValidation.isValid]);

  // Streamlined submit logic - creates mail piece and redirects to Stripe immediately
  const submitMailPiece = async () => {
    if (!formValidation.isValid || isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: Create mail piece
      const mailPiece = await createMailPiece({
        mailType: formData.mailType,
        mailClass: formData.mailClass,
        mailSize: formData.mailSize,
        senderAddressId: formData.senderAddressId!,
        recipientAddressId: formData.recipientAddressId!,
        fileId: formData.fileId!,
        description: formData.description || undefined,
        addressPlacement: formData.addressPlacement
      });

      // Step 2: Create Stripe checkout session and redirect immediately
      const checkoutData = await createMailCheckoutSession({
        mailPieceId: mailPiece.id
      });

      // Redirect to Stripe Checkout
      window.location.href = checkoutData.sessionUrl;

    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to process. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    await submitMailPiece();
  };

  // Memoized form update handler to prevent unnecessary re-renders
  const handleFormDataChange = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Simplified form validity check using Zod validation
  const isFormValid = useMemo(() => {
    return formValidation.isValid;
  }, [formValidation.isValid]);

  return (
    <div className={className}>
      {/* Error Alert */}
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{submitError}</AlertDescription>
        </Alert>
      )}

      {/* Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-8">
        {/* LEFT COLUMN: Smart Progressive Form */}
        <div className="space-y-4">
          {/* Sticky Selection Sections */}
          <div className="lg:sticky lg:top-6 lg:z-10 space-y-4">
          {/* File Section - with tabs for existing/upload */}
          {activeSection === 'file' ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5" />
                  Select or Upload File
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="existing" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Select Existing</TabsTrigger>
                    <TabsTrigger value="upload">Upload New</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="existing">
                    <FileSelector
                      selectedFileId={formData.fileId}
                      onFileSelect={(fileId) => setFormData(prev => ({ ...prev, fileId }))}
                      mailType={formData.mailType}
                      mailSize={formData.mailSize}
                      addressPlacement={formData.addressPlacement}
                      showPreview={false}
                      compact={false}
                    />
                  </TabsContent>
                  
                  <TabsContent value="upload">
                    <QuickFileUpload
                      onUploadSuccess={(fileId) => {
                        setFormData(prev => ({ ...prev, fileId }));
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <FileSelector
              selectedFileId={formData.fileId}
              onFileSelect={() => setActiveSection('file')}
              mailType={formData.mailType}
              mailSize={formData.mailSize}
              addressPlacement={formData.addressPlacement}
              showPreview={false}
              compact={true}
            />
          )}

          {/* Sender Section */}
          {formData.fileId && (
            activeSection === 'sender' ? (
              <AddressSelector
                selectedAddressId={formData.senderAddressId}
                onAddressSelect={(addressId) => setFormData(prev => ({ ...prev, senderAddressId: addressId }))}
                addressType="sender"
                onQuickAdd={() => setShowSenderModal(true)}
              />
            ) : senderAddress ? (
              <CompactAddressSection
                address={senderAddress}
                label="Sender"
                onEdit={() => setActiveSection('sender')}
              />
            ) : null
          )}

          {/* Recipient Section */}
          {formData.senderAddressId && (
            activeSection === 'recipient' ? (
              <AddressSelector
                selectedAddressId={formData.recipientAddressId}
                onAddressSelect={(addressId) => setFormData(prev => ({ ...prev, recipientAddressId: addressId }))}
                addressType="recipient"
                onQuickAdd={() => setShowRecipientModal(true)}
              />
            ) : recipientAddress ? (
              <CompactAddressSection
                address={recipientAddress}
                label="Recipient"
                onEdit={() => setActiveSection('recipient')}
              />
            ) : null
          )}
          </div>

          {/* Config Section - Not sticky, appears below */}
          {formData.recipientAddressId && activeSection !== 'complete' && (
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
              compact={activeSection !== 'config'}
            />
          )}
        </div>

        {/* RIGHT COLUMN: Order Summary (sticky on desktop) */}
        <div className="lg:sticky lg:top-6 lg:h-fit order-first lg:order-last">
          <OrderSummaryCard
            selectedFile={selectedFile}
            senderAddress={senderAddress}
            recipientAddress={recipientAddress}
            mailType={formData.mailType}
            mailClass={formData.mailClass}
            mailSize={formData.mailSize}
            addressPlacement={formData.addressPlacement}
            isValid={isFormValid}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            fileId={formData.fileId}
            senderAddressId={formData.senderAddressId}
            recipientAddressId={formData.recipientAddressId}
          />
        </div>
      </div>

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
