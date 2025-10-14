import { FormEvent, useEffect, useState } from 'react';
import { getPaginatedMailAddresses, deleteMailAddress, createMailAddress, updateMailAddress, validateAddress, useQuery } from 'wasp/client/operations';
import type { MailAddress } from 'wasp/entities';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Form, FormControl, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { EmptyAddressesState } from '../components/ui/empty-state';
import { PageHeader } from '../components/ui/page-header';
import { FormField, FormSection } from '../components/ui/form-field';
import { DataTable } from '../components/ui/data-table';
import { ViewMode } from '../components/ui/view-mode-toggle';
import { createAddressColumns } from './columns';
import { cn } from '../lib/utils';
import { ADDRESS_TYPES, SUPPORTED_COUNTRIES } from './validation';
import { SimpleAddressValidator } from '../shared/addressValidationSimple';
import { Plus } from 'lucide-react';

export default function AddressManagementPage() {
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedCountry, setSelectedCountry] = useState<string>('US');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  
  // Server-side pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Edit state management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Use paginated query
  const { data, isLoading, error, refetch } = useQuery(getPaginatedMailAddresses, {
    page: currentPage,
    limit: 20,
    search: searchQuery,
  });

  const addresses = data?.addresses || [];

  // Simple form validation using working validation utility
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

  const handleDelete = async (addressId: string) => {
    try {
      await deleteMailAddress({ id: addressId });
      refetch();
    } catch (error) {
      console.error('Error deleting address:', error);
      setAddressError(
        error instanceof Error ? error.message : 'Failed to delete address. Please try again.'
      );
    }
  };

  const handleEdit = (address: MailAddress) => {
    setEditingId(address.id);
    setEditFormData({
      contactName: address.contactName,
      companyName: address.companyName || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 || '',
      address_city: address.address_city,
      address_state: address.address_state,
      address_zip: address.address_zip,
      address_country: address.address_country,
      label: address.label || '',
      addressType: address.addressType,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingId) return;

    try {
      setIsCreating(true);
      await updateMailAddress({
        id: editingId,
        data: editFormData,
      });
      setIsEditModalOpen(false);
      setEditingId(null);
      setEditFormData({});
      refetch();
    } catch (error) {
      console.error('Error updating address:', error);
      setAddressError(error instanceof Error ? error.message : 'Failed to update address');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateAddress = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormErrors({});
    setFieldErrors({});
    setAddressError(null);

    const formData = new FormData(e.currentTarget);
    const validation = validateForm(formData);

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    try {
      setIsCreating(true);
      await createMailAddress({
        contactName: formData.get('contactName') as string,
        companyName: formData.get('companyName') as string || undefined,
        address_line1: formData.get('address_line1') as string,
        address_line2: formData.get('address_line2') as string || undefined,
        address_city: formData.get('address_city') as string,
        address_state: formData.get('address_state') as string,
        address_zip: formData.get('address_zip') as string,
        address_country: formData.get('address_country') as string,
        label: formData.get('label') as string || undefined,
        addressType: formData.get('addressType') as 'sender' | 'recipient' | 'both',
      });
      setIsCreateModalOpen(false);
      refetch();
      (e.target as HTMLFormElement).reset();
    } catch (error) {
      console.error('Error creating address:', error);
      setAddressError(error instanceof Error ? error.message : 'Failed to create address');
    } finally {
      setIsCreating(false);
    }
  };

  const columns = createAddressColumns(handleEdit, handleDelete);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Address Management"
            description="Manage your sender and recipient addresses"
          />
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Address Management"
          description="Manage your sender and recipient addresses"
          actions={
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Address</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateAddress} className="space-y-6 py-4">
                  {addressError && (
                    <Alert variant="destructive">
                      <AlertDescription>{addressError}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Contact Information */}
                  <FormSection title="Contact Information">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="Contact Name" required error={formErrors.contactName}>
                        <Input
                          name="contactName"
                          placeholder="John Doe"
                          required
                          onChange={() => clearFieldError('contactName')}
                        />
                      </FormField>
                      <FormField label="Company Name" error={fieldErrors.companyName}>
                        <Input
                          name="companyName"
                          placeholder="Acme Corp"
                          onChange={() => clearFieldError('companyName')}
                        />
                      </FormField>
                    </div>
                  </FormSection>

                  {/* Address Information */}
                  <FormSection title="Address Details">
                    <div className="space-y-4">
                      <FormField label="Address Line 1" required error={formErrors.address_line1}>
                        <Input
                          name="address_line1"
                          placeholder="123 Main St"
                          required
                          onChange={() => clearFieldError('address_line1')}
                        />
                      </FormField>
                      <FormField label="Address Line 2" error={fieldErrors.address_line2}>
                        <Input
                          name="address_line2"
                          placeholder="Suite 100"
                          onChange={() => clearFieldError('address_line2')}
                        />
                      </FormField>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField label="City" required error={formErrors.address_city}>
                          <Input
                            name="address_city"
                            placeholder="New York"
                            required
                            onChange={() => clearFieldError('address_city')}
                          />
                        </FormField>
                        <FormField label="State" required error={formErrors.address_state}>
                          <Input
                            name="address_state"
                            placeholder="NY"
                            required
                            onChange={() => clearFieldError('address_state')}
                          />
                        </FormField>
                        <FormField label="ZIP Code" required error={formErrors.address_zip}>
                          <Input
                            name="address_zip"
                            placeholder="10001"
                            required
                            onChange={() => clearFieldError('address_zip')}
                          />
                        </FormField>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField label="Country" required>
                          <Select name="address_country" defaultValue="US" onValueChange={setSelectedCountry}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              {SUPPORTED_COUNTRIES.map((country) => (
                                <SelectItem key={country} value={country}>
                                  {country}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Address Type" required>
                          <Select name="addressType" defaultValue="both">
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {ADDRESS_TYPES.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type.charAt(0).toUpperCase() + type.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormField>
                      </div>
                      <FormField label="Label (Optional)">
                        <Input
                          name="label"
                          placeholder="e.g., Home, Office"
                        />
                      </FormField>
                    </div>
                  </FormSection>

                  <div className="flex gap-2 justify-end pt-4">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Address'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          }
        />

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>Failed to load addresses. Please try again.</AlertDescription>
          </Alert>
        )}

        {addresses.length === 0 && !isLoading ? (
          <EmptyAddressesState onAdd={() => setIsCreateModalOpen(true)} />
        ) : (
          <>
            <DataTable
              columns={columns}
              data={addresses}
              enableViewToggle={true}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              searchable={false} // Server-side search handled separately
            />

            {/* Server-Side Pagination Controls */}
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Page {data.page} of {data.totalPages} ({data.total} total addresses)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= (data.totalPages || 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Address</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name *</Label>
                  <Input
                    value={editFormData.contactName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, contactName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Company Name</Label>
                  <Input
                    value={editFormData.companyName || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Address Line 1 *</Label>
                  <Input
                    value={editFormData.address_line1 || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address_line1: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Address Line 2</Label>
                  <Input
                    value={editFormData.address_line2 || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, address_line2: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input
                      value={editFormData.address_city || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address_city: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>State *</Label>
                    <Input
                      value={editFormData.address_state || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address_state: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ZIP Code *</Label>
                    <Input
                      value={editFormData.address_zip || ''}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, address_zip: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Select
                      value={editFormData.address_country || 'US'}
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, address_country: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SUPPORTED_COUNTRIES.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Address Type *</Label>
                    <Select
                      value={editFormData.addressType || 'both'}
                      onValueChange={(value) => setEditFormData(prev => ({ ...prev, addressType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ADDRESS_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Label</Label>
                  <Input
                    value={editFormData.label || ''}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g., Home, Office"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSave} disabled={isCreating}>
                  {isCreating ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

