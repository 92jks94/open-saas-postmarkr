import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createMailPiece, getMailPiece, getAllFilesByUser, getMailAddressesByUser, useQuery } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { ArrowLeft, FileText, Eye, Save, Check } from 'lucide-react';
import FileSelector from './FileSelector';
import AddressSelector from './AddressSelector';
import PaymentStep from './PaymentStep';
import QuickAddressModal from './QuickAddressModal';
import CompactStepCard from './CompactStepCard';
import MailConfigurationSection from './MailConfigurationSection';
import OrderSummaryCard from './OrderSummaryCard';
import BottomActionBar from './BottomActionBar';
import PDFViewer from './PDFViewer';
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
  mailType: string;
  mailClass: string;
  mailSize: string;
  senderAddressId: string | null;
  recipientAddressId: string | null;
  fileId: string | null;
  description: string;
  colorPrinting: boolean;
  doubleSided: boolean;
  addressPlacement: 'top_first_page' | 'insert_blank_page';
}

const MailCreationForm: React.FC<MailCreationFormProps> = ({
  onSuccess,
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    mailType: 'letter',
    mailClass: 'usps_first_class',
    mailSize: '4x6',
    senderAddressId: null,
    recipientAddressId: null,
    fileId: null,
    description: '',
    colorPrinting: false,
    doubleSided: true,
    addressPlacement: 'insert_blank_page',
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

  // Wizard expansion state - which steps are expanded
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([1])); // Start with step 1 expanded

  // Track which steps have been completed at least once (for smart progression)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // Quick add modal state
  const [showSenderModal, setShowSenderModal] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  // Auto-save draft state
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const DRAFT_KEY = 'mail_creation_draft';

  // Fetch user's files to get selected file details
  const { data: userFiles, isLoading: filesLoading } = useQuery(getAllFilesByUser);
  
  // Fetch user's addresses
  const { data: allAddresses, isLoading: addressesLoading } = useQuery(getMailAddressesByUser);
  
  // Find selected file
  const selectedFile = useMemo(() => {
    if (!formData.fileId || !userFiles) return null;
    return userFiles.find((f: File) => f.id === formData.fileId) || null;
  }, [formData.fileId, userFiles]);

  // Find selected sender address
  const senderAddress = useMemo(() => {
    if (!formData.senderAddressId || !allAddresses) return null;
    return allAddresses.find((a: MailAddress) => a.id === formData.senderAddressId) || null;
  }, [formData.senderAddressId, allAddresses]);

  // Find selected recipient address
  const recipientAddress = useMemo(() => {
    if (!formData.recipientAddressId || !allAddresses) return null;
    return allAddresses.find((a: MailAddress) => a.id === formData.recipientAddressId) || null;
  }, [formData.recipientAddressId, allAddresses]);

  // Determine step completion status
  const isStep1Complete = !!formData.fileId;
  const isStep2Complete = !!formData.senderAddressId;
  const isStep3Complete = !!formData.recipientAddressId;
  const isStep4Complete = true; // Mail config has defaults

  // Helper function to determine if we should auto-progress (only on first completion, not when editing)
  const shouldAutoProgress = (stepNumber: number, isCurrentlyComplete: boolean) => {
    // Only auto-progress if:
    // 1. The step just became complete (isCurrentlyComplete is true)
    // 2. This is the first time this step has been completed (not in completedSteps set)
    // This prevents auto-progression when users go back to edit existing selections
    return isCurrentlyComplete && !completedSteps.has(stepNumber);
  };

  // Update completed steps tracking when steps become complete
  useEffect(() => {
    const newCompletedSteps = new Set(completedSteps);
    if (isStep1Complete && !completedSteps.has(1)) {
      newCompletedSteps.add(1);
    }
    if (isStep2Complete && !completedSteps.has(2)) {
      newCompletedSteps.add(2);
    }
    if (isStep3Complete && !completedSteps.has(3)) {
      newCompletedSteps.add(3);
    }
    if (isStep4Complete && !completedSteps.has(4)) {
      newCompletedSteps.add(4);
    }
    
    if (newCompletedSteps.size !== completedSteps.size) {
      setCompletedSteps(newCompletedSteps);
    }
  }, [isStep1Complete, isStep2Complete, isStep3Complete, isStep4Complete, completedSteps]);

  // Auto-expand next incomplete step (only on first completion)
  useEffect(() => {
    if (shouldAutoProgress(1, isStep1Complete) && !expandedSteps.has(2) && !isStep2Complete) {
      setExpandedSteps(prev => new Set([...prev, 2]));
    }
    if (shouldAutoProgress(2, isStep2Complete) && !expandedSteps.has(3) && !isStep3Complete) {
      setExpandedSteps(prev => new Set([...prev, 3]));
    }
  }, [isStep1Complete, isStep2Complete, isStep3Complete, expandedSteps, completedSteps]);

  // Toggle step expansion
  const toggleStep = (stepNumber: number) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepNumber)) {
        newSet.delete(stepNumber);
      } else {
        newSet.add(stepNumber);
      }
      return newSet;
    });
  };

  // Simplified form validation
  const formValidation = useMemo(() => {
    const mailCreationData = {
      senderAddressId: formData.senderAddressId || '',
      recipientAddressId: formData.recipientAddressId || '',
      fileId: formData.fileId || '',
      description: formData.description || '',
    };

    const validation = SimpleAddressValidator.validateMailCreation(mailCreationData);
    
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

  // Validation function
  const validateForm = useCallback((): boolean => {
    return formValidation.isValid;
  }, [formValidation.isValid]);

  // Submit mail piece
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

      const completeMailPiece = await getMailPiece({ id: result.id });
      if (completeMailPiece) {
        setCreatedMailPiece(completeMailPiece);
        setCurrentStep('payment');
        clearDraft(); // Clear draft after successful creation
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
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm() || isSubmitting) {
      return;
    }

    await submitMailPiece();
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

  // Load draft from localStorage on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        setLastSaved(new Date(parsed.savedAt));
      } catch (error) {
        console.error('Failed to load draft:', error);
      }
    }
  }, []);

  // Auto-save draft to localStorage whenever formData changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      const draftData = { ...formData, savedAt: new Date().toISOString() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
      setLastSaved(new Date());
      setTimeout(() => setIsSaving(false), 500);
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [formData]);

  // Manual save draft handler
  const handleSaveDraft = useCallback(() => {
    setIsSaving(true);
    const draftData = { ...formData, savedAt: new Date().toISOString() };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
    setLastSaved(new Date());
    setTimeout(() => setIsSaving(false), 1000);
  }, [formData]);

  // Clear draft after successful submission
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setLastSaved(null);
  }, []);

  // Memoized form update handler
  const handleFormDataChange = useCallback((updates: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Form validity check
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

  // Main form - Single Page Wizard Layout
  return (
    <div className={className}>
      {/* Single Row: Two-column layout - Form + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] xl:grid-cols-[1fr_500px] gap-6 mb-24 lg:mb-6">
        {/* LEFT COLUMN: Wizard Steps + PDF Preview */}
        <div className="space-y-6">
          {/* Wizard Steps */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
            {/* Step 1: Select File */}
            <CompactStepCard
            stepNumber={1}
            title="Select File"
            summary={selectedFile ? `${selectedFile.name} (${selectedFile.pageCount} pages)` : undefined}
            isCompleted={isStep1Complete}
            isExpanded={expandedSteps.has(1)}
            isDisabled={false}
            onClick={() => toggleStep(1)}
          >
            <FileSelector
              selectedFileId={formData.fileId}
              onFileSelect={(fileId) => {
                setFormData(prev => ({ ...prev, fileId }));
                // Only auto-progress on first completion, not when editing
                if (fileId && shouldAutoProgress(1, true)) {
                  setExpandedSteps(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(1);
                    newSet.add(2);
                    return newSet;
                  });
                }
              }}
              mailType={formData.mailType}
              mailSize={formData.mailSize}
              addressPlacement={formData.addressPlacement}
              showPreview={false}
              compact={false}
            />
          </CompactStepCard>

          {/* Step 2: Sender Address */}
          <CompactStepCard
            stepNumber={2}
            title="Select Sender Address"
            summary={senderAddress 
              ? `${senderAddress.contactName} • ${senderAddress.address_city}, ${senderAddress.address_state}` 
              : undefined
            }
            isCompleted={isStep2Complete}
            isExpanded={expandedSteps.has(2)}
            isDisabled={!isStep1Complete}
            onClick={() => toggleStep(2)}
          >
            <AddressSelector
              selectedAddressId={formData.senderAddressId}
              onAddressSelect={(addressId) => {
                setFormData(prev => ({ ...prev, senderAddressId: addressId }));
                // Only auto-progress on first completion, not when editing
                if (addressId && shouldAutoProgress(2, true)) {
                  setExpandedSteps(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(2);
                    newSet.add(3);
                    return newSet;
                  });
                }
              }}
              addressType="sender"
              onQuickAdd={() => setShowSenderModal(true)}
            />
          </CompactStepCard>

          {/* Step 3: Recipient Address */}
          <CompactStepCard
            stepNumber={3}
            title="Select Recipient Address"
            summary={recipientAddress 
              ? `${recipientAddress.contactName} • ${recipientAddress.address_city}, ${recipientAddress.address_state}` 
              : undefined
            }
            isCompleted={isStep3Complete}
            isExpanded={expandedSteps.has(3)}
            isDisabled={!isStep2Complete}
            onClick={() => toggleStep(3)}
          >
            <AddressSelector
              selectedAddressId={formData.recipientAddressId}
              onAddressSelect={(addressId) => {
                setFormData(prev => ({ ...prev, recipientAddressId: addressId }));
                // Only auto-progress on first completion, not when editing
                if (addressId && shouldAutoProgress(3, true)) {
                  setExpandedSteps(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(3);
                    return newSet;
                  });
                }
              }}
              addressType="recipient"
              onQuickAdd={() => setShowRecipientModal(true)}
            />
          </CompactStepCard>

          {/* Step 4: Mail Configuration (Optional Customization) */}
          <CompactStepCard
            stepNumber={4}
            title="Mail Configuration"
            summary={`${formData.mailType} • ${formData.mailClass.replace('usps_', '').replace(/_/g, ' ')}`}
            isCompleted={isStep4Complete}
            isExpanded={expandedSteps.has(4)}
            isDisabled={!isStep3Complete}
            onClick={() => toggleStep(4)}
          >
            <MailConfigurationSection
              formData={{
                mailType: formData.mailType,
                mailClass: formData.mailClass,
                mailSize: formData.mailSize,
                description: formData.description,
                addressPlacement: formData.addressPlacement
              }}
              onChange={handleFormDataChange}
              compact={false}
              errors={errors}
            />
          </CompactStepCard>
          </div>
          
          {/* Document Preview - Below Steps (Desktop) */}
          {selectedFile && selectedFile.key && (
            <Card className="hidden lg:block">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Document Preview
                  <span className="text-sm font-normal text-gray-500 ml-2">
                    ({selectedFile.pageCount} {selectedFile.pageCount === 1 ? 'page' : 'pages'})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PDFViewer 
                  fileKey={selectedFile.key}
                  className="border-0"
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT COLUMN: Order Summary (40%) */}
        <div className="hidden lg:block">
          <OrderSummaryCard
            selectedFile={selectedFile}
            senderAddress={senderAddress}
            recipientAddress={recipientAddress}
            mailConfig={formData}
            isValid={isFormValid}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Mobile-Only: Document Preview below steps */}
      {selectedFile && selectedFile.key && (
        <Card className="lg:hidden w-full mb-24">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="h-5 w-5 text-blue-600" />
              Document Preview
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({selectedFile.pageCount} {selectedFile.pageCount === 1 ? 'page' : 'pages'})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PDFViewer 
              fileKey={selectedFile.key}
              className="border-0"
            />
          </CardContent>
        </Card>
      )}

      {/* Sticky Bottom Action Bar - Mobile/Tablet Only */}
      <BottomActionBar
        isValid={isFormValid}
        isSubmitting={isSubmitting}
        pageCount={selectedFile?.pageCount || 0}
        mailClass={formData.mailClass}
        mailType={formData.mailType}
        addressPlacement={formData.addressPlacement}
        onSubmit={handleSubmit}
        errors={errors}
        fileSelected={!!formData.fileId}
        addressesSelected={!!(formData.senderAddressId && formData.recipientAddressId)}
        onSaveDraft={handleSaveDraft}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

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
