import React, { useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../../components/ui/accordion';
import { Mail, CheckCircle, Settings } from 'lucide-react';
import { getMailTypeOptions, getMailClassOptions, getMailSizeOptions } from '../../config/features';
import { cn } from '../../lib/utils';

/**
 * Form data structure for mail configuration
 */
export interface MailConfigData {
  mailType: string;
  mailClass: string;
  mailSize: string;
  description: string;
  addressPlacement: 'top_first_page' | 'insert_blank_page';
}

/**
 * Props for MailConfigurationSection component
 */
interface MailConfigurationSectionProps {
  /** Current form data */
  formData: MailConfigData;
  /** Callback when any field changes */
  onChange: (updates: Partial<MailConfigData>) => void;
  /** Compact mode for two-column layout (smaller text, spacing) */
  compact?: boolean;
  /** Optional validation errors */
  errors?: Record<string, string>;
  /** Optional CSS classes */
  className?: string;
}

/**
 * MailConfigurationSection - Reusable mail configuration UI
 * 
 * Features:
 * - Mail type, class, and size selection
 * - Advanced settings (address placement, description)
 * - Compact mode for two-column layouts
 * - Validation error display
 * - Responsive design
 */
export const MailConfigurationSection: React.FC<MailConfigurationSectionProps> = ({
  formData,
  onChange,
  compact = false,
  errors = {},
  className = ''
}) => {
  // Get configuration options from feature flags
  const mailTypeOptions = getMailTypeOptions();
  const mailClassOptions = getMailClassOptions();
  
  // Memoize size options to prevent recreation on every render
  const sizeOptions = useMemo(() => {
    return getMailSizeOptions(formData.mailType);
  }, [formData.mailType]);

  // Reset size when mail type changes if current size is invalid
  useEffect(() => {
    if (sizeOptions.length > 0 && !sizeOptions.find(option => option.value === formData.mailSize)) {
      onChange({ mailSize: sizeOptions[0].value });
    }
  }, [formData.mailType, sizeOptions, formData.mailSize, onChange]);

  // Check if all required fields are filled
  const isComplete = formData.mailType && formData.mailClass && formData.mailSize;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className={cn("flex items-center gap-2", compact && "text-base")}>
          <Mail className={cn("h-5 w-5", compact && "h-4 w-4")} />
          Mail Configuration
          {isComplete && (
            <CheckCircle className={cn("h-5 w-5 text-green-500 ml-1", compact && "h-4 w-4")} />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4", compact && "space-y-3")}>
        {/* Mail Type */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="mailType" className={cn(compact && "text-sm")}>Mail Type</Label>
            {formData.mailType === 'letter' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                Recommended
              </Badge>
            )}
          </div>
          <Select
            value={formData.mailType}
            onValueChange={(value) => onChange({ mailType: value })}
          >
            <SelectTrigger className={cn(compact && "text-sm")}>
              <SelectValue placeholder="Select mail type" />
            </SelectTrigger>
            <SelectContent>
              {mailTypeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className={cn("font-medium", compact && "text-sm")}>
                      {option.label}
                      {option.value === 'letter' && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mail Class */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="mailClass" className={cn(compact && "text-sm")}>Mail Class</Label>
            {formData.mailClass === 'usps_first_class' && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                Recommended
              </Badge>
            )}
          </div>
          <Select
            value={formData.mailClass}
            onValueChange={(value) => onChange({ mailClass: value })}
          >
            <SelectTrigger className={cn(compact && "text-sm")}>
              <SelectValue placeholder="Select mail class" />
            </SelectTrigger>
            <SelectContent>
              {mailClassOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className={cn("font-medium", compact && "text-sm")}>
                      {option.label}
                      {option.value === 'usps_first_class' && (
                        <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 text-xs">
                          Recommended
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Mail Size */}
        <div className="space-y-2">
          <Label htmlFor="mailSize" className={cn(compact && "text-sm")}>Mail Size</Label>
          <Select
            value={formData.mailSize}
            onValueChange={(value) => onChange({ mailSize: value })}
          >
            <SelectTrigger className={cn(compact && "text-sm")}>
              <SelectValue placeholder="Select mail size" />
            </SelectTrigger>
            <SelectContent>
              {sizeOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  <div>
                    <div className={cn("font-medium", compact && "text-sm")}>{option.label}</div>
                    <div className="text-xs text-gray-500">{option.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Advanced Settings Accordion - Only show in non-compact mode or always? Let's always show but make it more compact */}
        <Accordion type="single" collapsible className="border rounded-lg px-4">
          <AccordionItem value="advanced" className="border-none">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className={cn("font-medium", compact && "text-sm")}>Advanced Settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2">
              {/* Address Placement */}
              <div className="space-y-2">
                <Label htmlFor="addressPlacement" className={cn(compact && "text-sm")}>
                  Address Placement
                </Label>
                <Select
                  value={formData.addressPlacement}
                  onValueChange={(value: 'top_first_page' | 'insert_blank_page') => 
                    onChange({ addressPlacement: value })
                  }
                >
                  <SelectTrigger className={cn(compact && "text-sm")}>
                    <SelectValue placeholder="Select address placement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insert_blank_page">
                      <div>
                        <div className={cn("font-medium", compact && "text-sm")}>Insert Blank Page</div>
                        <div className="text-xs text-gray-500">Adds an extra page for address (recommended)</div>
                      </div>
                    </SelectItem>
                    <SelectItem value="top_first_page">
                      <div>
                        <div className={cn("font-medium", compact && "text-sm")}>Top of First Page</div>
                        <div className="text-xs text-gray-500">Address printed on your first page (cost-effective)</div>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="text-xs text-gray-500">
                  {formData.addressPlacement === 'insert_blank_page' 
                    ? 'Lob will add a blank page at the beginning for the recipient address. This ensures your content remains unchanged but adds an extra page cost.'
                    : 'Lob will print the recipient address at the top of your first page. Make sure to leave space at the top of your document for the address block.'
                  }
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className={cn(compact && "text-sm")}>
                  Description (Optional)
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this mail piece..."
                  value={formData.description}
                  onChange={(e) => onChange({ description: e.target.value })}
                  maxLength={500}
                  rows={3}
                  className={cn(compact && "text-sm")}
                />
                <div className="text-xs text-gray-500">
                  {formData.description.length}/500 characters
                </div>
                {errors.description && (
                  <p className="text-xs text-red-600">{errors.description}</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default MailConfigurationSection;

