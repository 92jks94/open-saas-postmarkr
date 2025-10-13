import { useState, useMemo, useEffect, useCallback } from 'react';
import { createMailPiece, getMailPiece } from 'wasp/client/operations';
import type { MailPiece, MailAddress, File } from 'wasp/entities';
import { SimpleAddressValidator } from '../../shared/addressValidationSimple';

/**
 * Form data structure for mail piece creation
 */
export interface MailFormData {
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

/**
 * Type for mail piece with complete relations
 */
export type MailPieceWithRelations = MailPiece & {
  senderAddress: MailAddress;
  recipientAddress: MailAddress;
  file?: File | null;
};

/**
 * Custom hook for managing mail creation form state and logic
 * 
 * Extracts complex state management and validation logic from the component,
 * making it easier to test and maintain.
 * 
 * @returns Form state, handlers, and validation state
 */
export function useMailCreationForm() {
  // Form data state
  const [formData, setFormData] = useState<MailFormData>({
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

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Payment step state
  const [currentStep, setCurrentStep] = useState<'form' | 'payment'>('form');
  const [createdMailPiece, setCreatedMailPiece] = useState<MailPieceWithRelations | null>(null);

  // Form validation using Zod
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
  const submitMailPiece = useCallback(async () => {
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
        setCreatedMailPiece(completeMailPiece as MailPieceWithRelations);
        setCurrentStep('payment');
      } else {
        throw new Error('Failed to load mail piece details');
      }
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create mail piece');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || isSubmitting) {
      return;
    }
    await submitMailPiece();
  }, [validateForm, isSubmitting, submitMailPiece]);

  // Update form data
  const updateFormData = useCallback((updates: Partial<MailFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  // Reset form
  const resetForm = useCallback(() => {
    setFormData({
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
    setErrors({});
    setSubmitError(null);
    setCurrentStep('form');
    setCreatedMailPiece(null);
  }, []);

  // Go back to form step
  const handleBackToForm = useCallback(() => {
    setCurrentStep('form');
    setCreatedMailPiece(null);
  }, []);

  // Handle payment cancel
  const handlePaymentCancel = useCallback(() => {
    setCurrentStep('form');
    setCreatedMailPiece(null);
  }, []);

  return {
    // Form data
    formData,
    updateFormData,
    
    // Validation
    errors,
    isFormValid: formValidation.isValid,
    validateForm,
    
    // Submission
    isSubmitting,
    submitError,
    handleSubmit,
    
    // Payment step
    currentStep,
    createdMailPiece,
    handleBackToForm,
    handlePaymentCancel,
    
    // Utilities
    resetForm,
  };
}

