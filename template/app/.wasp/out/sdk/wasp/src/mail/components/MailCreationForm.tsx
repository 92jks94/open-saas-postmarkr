import React, { useState, useEffect } from 'react';
import { useAction, createMailPiece } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Badge } from '../../components/ui/badge';
import { Mail, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import FileSelector from './FileSelector';
import AddressSelector from './AddressSelector';

interface MailCreationFormProps {
  onSuccess?: (mailPieceId: string) => void;
  className?: string;
}

interface FormData {
  mailType: string;
  mailClass: string;
  mailSize: string;
  senderAddressId: string | null;
  recipientAddressId: string | null;
  fileId: string | null;
  description: string;
}

const MailCreationForm: React.FC<MailCreationFormProps> = ({
  onSuccess,
  className = ''
}) => {
  const [formData, setFormData] = useState<FormData>({
    mailType: 'letter',
    mailClass: 'usps_first_class',
    mailSize: '6x9',
    senderAddressId: null,
    recipientAddressId: null,
    fileId: null,
    description: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMailPieceAction = useAction(createMailPiece);

  // Mail type options
  const mailTypeOptions = [
    { value: 'postcard', label: 'Postcard', description: 'Single-sided mail piece' },
    { value: 'letter', label: 'Letter', description: 'Standard letter format' },
    { value: 'check', label: 'Check', description: 'Check or payment document' },
    { value: 'self_mailer', label: 'Self Mailer', description: 'Self-contained mail piece' },
    { value: 'catalog', label: 'Catalog', description: 'Multi-page catalog' },
    { value: 'booklet', label: 'Booklet', description: 'Bound booklet format' }
  ];

  // Mail class options
  const mailClassOptions = [
    { value: 'usps_first_class', label: 'First Class', description: 'Fastest delivery, highest priority' },
    { value: 'usps_standard', label: 'Standard', description: 'Economical option for bulk mail' },
    { value: 'usps_express', label: 'Express', description: 'Overnight delivery' },
    { value: 'usps_priority', label: 'Priority', description: '1-3 business days' }
  ];

  // Mail size options based on mail type
  const getMailSizeOptions = (mailType: string) => {
    const sizeOptions: Record<string, Array<{ value: string; label: string; description: string }>> = {
      'postcard': [
        { value: '4x6', label: '4" × 6"', description: 'Standard postcard size' }
      ],
      'letter': [
        { value: '6x9', label: '6" × 9"', description: 'Standard letter size' },
        { value: '6x11', label: '6" × 11"', description: 'Legal size letter' }
      ],
      'check': [
        { value: '6x9', label: '6" × 9"', description: 'Standard check size' }
      ],
      'self_mailer': [
        { value: '6x9', label: '6" × 9"', description: 'Standard self mailer' },
        { value: '6x11', label: '6" × 11"', description: 'Legal size self mailer' },
        { value: '6x18', label: '6" × 18"', description: 'Large self mailer' }
      ],
      'catalog': [
        { value: '9x12', label: '9" × 12"', description: 'Standard catalog size' },
        { value: '12x15', label: '12" × 15"', description: 'Large catalog' },
        { value: '12x18', label: '12" × 18"', description: 'Extra large catalog' }
      ],
      'booklet': [
        { value: '6x9', label: '6" × 9"', description: 'Standard booklet' },
        { value: '9x12', label: '9" × 12"', description: 'Large booklet' }
      ]
    };

    return sizeOptions[mailType] || sizeOptions['letter'];
  };

  // Validation
  const validateForm = (): boolean => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await createMailPieceAction({
        mailType: formData.mailType,
        mailClass: formData.mailClass,
        mailSize: formData.mailSize,
        senderAddressId: formData.senderAddressId!,
        recipientAddressId: formData.recipientAddressId!,
        fileId: formData.fileId!,
        description: formData.description || undefined
      });

      if (onSuccess) {
        onSuccess(result.id);
      }
    } catch (error: any) {
      setSubmitError(error.message || 'Failed to create mail piece');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset size when mail type changes
  useEffect(() => {
    const sizeOptions = getMailSizeOptions(formData.mailType);
    if (sizeOptions.length > 0 && !sizeOptions.find(option => option.value === formData.mailSize)) {
      setFormData(prev => ({ ...prev, mailSize: sizeOptions[0].value }));
    }
  }, [formData.mailType]);

  const isFormValid = formData.senderAddressId && 
                     formData.recipientAddressId && 
                     formData.fileId &&
                     formData.senderAddressId !== formData.recipientAddressId;

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
                  {getMailSizeOptions(formData.mailType).map(option => (
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
                <Send className="h-4 w-4 mr-2" />
                Create Mail Piece
              </>
            )}
          </Button>
        </div>

        {/* Form Status */}
        {isFormValid && (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Ready to create mail piece</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default MailCreationForm;
