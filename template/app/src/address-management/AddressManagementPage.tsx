import { FormEvent, useEffect, useState } from 'react';
import { getMailAddressesByUser, deleteMailAddress, createMailAddress, updateMailAddress, useQuery } from 'wasp/client/operations';
import type { MailAddress } from 'wasp/entities';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../components/ui/form';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Separator } from '../components/ui/separator';
import { cn } from '../lib/utils';
import { ADDRESS_TYPES, SUPPORTED_COUNTRIES } from './validation';

export default function AddressManagementPage() {
  const [addressError, setAddressError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Edit state management
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Record<string, string>>({});

  // Copy exact useQuery pattern from FileUploadPage
  const allUserAddresses = useQuery(getMailAddressesByUser, undefined, {
    enabled: false, // Same pattern as file upload
  });

  useEffect(() => {
    allUserAddresses.refetch();
  }, []);

  // Simple form validation
  const validateForm = (formData: FormData): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    const contactName = formData.get('contactName') as string;
    const address_line1 = formData.get('address_line1') as string;
    const address_city = formData.get('address_city') as string;
    const address_state = formData.get('address_state') as string;
    const address_zip = formData.get('address_zip') as string;
    const address_country = formData.get('address_country') as string;

    if (!contactName?.trim()) {
      errors.contactName = 'Contact name is required';
    }
    if (!address_line1?.trim()) {
      errors.address_line1 = 'Address line 1 is required';
    }
    if (!address_city?.trim()) {
      errors.address_city = 'City is required';
    }
    if (!address_state?.trim()) {
      errors.address_state = 'State is required';
    }
    if (!address_zip?.trim()) {
      errors.address_zip = 'Postal code is required';
    }
    if (!address_country?.trim()) {
      errors.address_country = 'Country is required';
    }

    return errors;
  };

  // Copy exact delete pattern from FileUploadPage
  const handleDelete = async (addressId: string) => {
    try {
      await deleteMailAddress({ id: addressId });
      allUserAddresses.refetch();
    } catch (error) {
      console.error('Error deleting address:', error);
      setAddressError(
        error instanceof Error ? error.message : 'Failed to delete address. Please try again.'
      );
    }
  };

  // Edit handlers
  const handleEditClick = (address: MailAddress) => {
    setEditingId(address.id);
    setEditFormData({
      contactName: address.contactName,
      companyName: address.companyName || '',
      address_line1: address.address_line1,
      address_line2: address.address_line2 ?? '',
      address_city: address.address_city,
      address_state: address.address_state,
      address_zip: address.address_zip,
      address_country: address.address_country,
      label: address.label || '',
      addressType: address.addressType,
    });
  };

  const handleEditSave = async (addressId: string) => {
    try {
      await updateMailAddress({ id: addressId, data: editFormData });
      setEditingId(null);
      allUserAddresses.refetch();
    } catch (error) {
      console.error('Edit failed:', error);
      setAddressError(
        error instanceof Error ? error.message : 'Failed to update address. Please try again.'
      );
    }
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditFormData({});
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
      const errors = validateForm(formData);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setIsCreating(false);
        return;
      }
      
      const addressTypeValue = formData.get('addressType') as string || 'both';
      const validAddressTypes = ['sender', 'recipient', 'both'] as const;
      const addressType = validAddressTypes.includes(addressTypeValue as any) 
        ? (addressTypeValue as 'sender' | 'recipient' | 'both')
        : 'both';

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
        addressType,
      };

      await createMailAddress(addressData);
      formElement.reset();
      allUserAddresses.refetch();
    } catch (error) {
      console.error('Error creating address:', error);
      setAddressError(
        error instanceof Error ? error.message : 'An unexpected error occurred while creating the address.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        {/* Copy exact header pattern from FileUploadPage */}
        <div className='mx-auto max-w-4xl text-center'>
          <h2 className='mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
            <span className='text-primary'>Address</span> Management
          </h2>
        </div>
        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground'>
          Manage your saved addresses for quick mail sending
        </p>

        {/* Enhanced Card structure with better layout */}
        <Card className='my-8'>
          <CardContent className='space-y-8 my-10 py-8 px-6 mx-auto sm:max-w-2xl'>
            {/* Address creation form with improved layout */}
            <div className='space-y-6'>
              <div className='text-center'>
                <h3 className='text-xl font-semibold text-foreground mb-2'>Add New Address</h3>
                <p className='text-sm text-muted-foreground'>Fill in the details below to save a new address</p>
              </div>
              
              <form onSubmit={handleCreateAddress} className='space-y-6'>
                {/* Contact Information Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <div className='h-px bg-border flex-1'></div>
                    <span className='text-sm font-medium text-muted-foreground px-3'>Contact Information</span>
                    <div className='h-px bg-border flex-1'></div>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='contactName' className='text-sm font-medium'>Contact Name *</Label>
                      <Input
                        id='contactName'
                        name='contactName'
                        placeholder='John Doe'
                        required
                        onChange={() => {
                          setAddressError(null);
                          if (formErrors.contactName) {
                            setFormErrors(prev => ({ ...prev, contactName: '' }));
                          }
                        }}
                        className={cn('h-10', formErrors.contactName && 'border-red-500')}
                      />
                      {formErrors.contactName && (
                        <p className='text-sm text-red-600'>{formErrors.contactName}</p>
                      )}
                    </div>
                    
                    <div className='space-y-2'>
                      <Label htmlFor='companyName' className='text-sm font-medium'>Company Name</Label>
                      <Input
                        id='companyName'
                        name='companyName'
                        placeholder='Acme Corp'
                        onChange={() => setAddressError(null)}
                        className='h-10'
                      />
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <div className='h-px bg-border flex-1'></div>
                    <span className='text-sm font-medium text-muted-foreground px-3'>Address Details</span>
                    <div className='h-px bg-border flex-1'></div>
                  </div>
                  
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='address_line1' className='text-sm font-medium'>Address Line 1 *</Label>
                      <Input
                        id='address_line1'
                        name='address_line1'
                        placeholder='123 Main St'
                        required
                        onChange={() => {
                          setAddressError(null);
                          if (formErrors.address_line1) {
                            setFormErrors(prev => ({ ...prev, address_line1: '' }));
                          }
                        }}
                        className={cn('h-10', formErrors.address_line1 && 'border-red-500')}
                      />
                      {formErrors.address_line1 && (
                        <p className='text-sm text-red-600'>{formErrors.address_line1}</p>
                      )}
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='address_line2' className='text-sm font-medium'>Address Line 2</Label>
                      <Input
                        id='address_line2'
                        name='address_line2'
                        placeholder='Suite 100, Apartment 2B'
                        onChange={() => setAddressError(null)}
                        className='h-10'
                      />
                    </div>

                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='space-y-2'>
                        <Label htmlFor='address_city' className='text-sm font-medium'>City *</Label>
                        <Input
                          id='address_city'
                          name='address_city'
                          placeholder='New York'
                          required
                          onChange={() => {
                            setAddressError(null);
                            if (formErrors.address_city) {
                              setFormErrors(prev => ({ ...prev, address_city: '' }));
                            }
                          }}
                          className={cn('h-10', formErrors.address_city && 'border-red-500')}
                        />
                        {formErrors.address_city && (
                          <p className='text-sm text-red-600'>{formErrors.address_city}</p>
                        )}
                      </div>
                      
                      <div className='space-y-2'>
                        <Label htmlFor='address_state' className='text-sm font-medium'>State *</Label>
                        <Input
                          id='address_state'
                          name='address_state'
                          placeholder='NY'
                          required
                          onChange={() => {
                            setAddressError(null);
                            if (formErrors.address_state) {
                              setFormErrors(prev => ({ ...prev, address_state: '' }));
                            }
                          }}
                          className={cn('h-10', formErrors.address_state && 'border-red-500')}
                        />
                        {formErrors.address_state && (
                          <p className='text-sm text-red-600'>{formErrors.address_state}</p>
                        )}
                      </div>
                      
                      <div className='space-y-2'>
                        <Label htmlFor='address_zip' className='text-sm font-medium'>Postal Code *</Label>
                        <Input
                          id='address_zip'
                          name='address_zip'
                          placeholder='10001'
                          required
                          onChange={() => {
                            setAddressError(null);
                            if (formErrors.address_zip) {
                              setFormErrors(prev => ({ ...prev, address_zip: '' }));
                            }
                          }}
                          className={cn('h-10', formErrors.address_zip && 'border-red-500')}
                        />
                        {formErrors.address_zip && (
                          <p className='text-sm text-red-600'>{formErrors.address_zip}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Settings Section */}
                <div className='space-y-4'>
                  <div className='flex items-center gap-2'>
                    <div className='h-px bg-border flex-1'></div>
                    <span className='text-sm font-medium text-muted-foreground px-3'>Settings</span>
                    <div className='h-px bg-border flex-1'></div>
                  </div>
                  
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='address_country' className='text-sm font-medium'>Country *</Label>
                      <Select 
                        name='address_country' 
                        required
                        onValueChange={() => {
                          setAddressError(null);
                          if (formErrors.address_country) {
                            setFormErrors(prev => ({ ...prev, address_country: '' }));
                          }
                        }}
                      >
                        <SelectTrigger className={cn('h-10', formErrors.address_country && 'border-red-500')}>
                          <SelectValue placeholder='Select country' />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_COUNTRIES.map((country) => (
                            <SelectItem key={country} value={country}>
                              {country}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formErrors.address_country && (
                        <p className='text-sm text-red-600'>{formErrors.address_country}</p>
                      )}
                    </div>
                    
                    <div className='space-y-2'>
                      <Label htmlFor='addressType' className='text-sm font-medium'>Address Type</Label>
                      <Select name='addressType' defaultValue='both'>
                        <SelectTrigger className='h-10'>
                          <SelectValue placeholder='Select type' />
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

                  <div className='space-y-2'>
                    <Label htmlFor='label' className='text-sm font-medium'>Label</Label>
                    <Input
                      id='label'
                      name='label'
                      placeholder='Home, Office, Client ABC'
                      onChange={() => setAddressError(null)}
                      className='h-10'
                    />
                  </div>
                </div>

                {/* Submit Button with better styling */}
                <div className='pt-4'>
                  <Button 
                    type='submit' 
                    disabled={isCreating} 
                    className='w-full h-11 text-base font-medium'
                    size='lg'
                  >
                    {isCreating ? 'Creating Address...' : 'Create Address'}
                  </Button>
                </div>

                {addressError && (
                  <Alert variant='destructive' className='mt-4'>
                    <AlertDescription>{addressError}</AlertDescription>
                  </Alert>
                )}
              </form>
            </div>

            <Separator className='my-8' />
            
            {/* Enhanced address list section */}
            <div className='space-y-6'>
              <div className='text-center'>
                <CardTitle className='text-xl font-bold text-foreground mb-2'>Saved Addresses</CardTitle>
                <p className='text-sm text-muted-foreground'>Manage your saved addresses for quick access</p>
              </div>
              
              {allUserAddresses.isLoading && (
                <div className='flex items-center justify-center py-8'>
                  <div className='text-center'>
                    <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2'></div>
                    <p className='text-muted-foreground'>Loading addresses...</p>
                  </div>
                </div>
              )}
              
              {allUserAddresses.error && (
                <Alert variant='destructive'>
                  <AlertDescription>Error: {allUserAddresses.error.message}</AlertDescription>
                </Alert>
              )}
              
              {!!allUserAddresses.data && allUserAddresses.data.length > 0 && !allUserAddresses.isLoading ? (
                <div className='grid gap-4'>
                  {allUserAddresses.data.map((address: MailAddress) => (
                    <Card key={address.id} className='p-6 hover:shadow-md transition-shadow'>
                      {editingId === address.id ? (
                        // Edit mode
                        <div className='space-y-4'>
                          <div className='text-center'>
                            <h3 className='text-lg font-semibold text-foreground mb-2'>Edit Address</h3>
                          </div>
                          
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                              <Label htmlFor={`edit-contactName-${address.id}`} className='text-sm font-medium'>Contact Name *</Label>
                              <Input
                                id={`edit-contactName-${address.id}`}
                                value={editFormData.contactName}
                                onChange={(e) => setEditFormData(prev => ({...prev, contactName: e.target.value}))}
                                className='h-10'
                              />
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor={`edit-companyName-${address.id}`} className='text-sm font-medium'>Company Name</Label>
                              <Input
                                id={`edit-companyName-${address.id}`}
                                value={editFormData.companyName}
                                onChange={(e) => setEditFormData(prev => ({...prev, companyName: e.target.value}))}
                                className='h-10'
                              />
                            </div>
                          </div>
                          
                          <div className='space-y-2'>
                            <Label htmlFor={`edit-address_line1-${address.id}`} className='text-sm font-medium'>Address Line 1 *</Label>
                            <Input
                              id={`edit-address_line1-${address.id}`}
                              value={editFormData.address_line1}
                              onChange={(e) => setEditFormData(prev => ({...prev, address_line1: e.target.value}))}
                              className='h-10'
                            />
                          </div>
                          
                          <div className='space-y-2'>
                            <Label htmlFor={`edit-address_line2-${address.id}`} className='text-sm font-medium'>Address Line 2</Label>
                            <Input
                              id={`edit-address_line2-${address.id}`}
                              value={editFormData.address_line2}
                              onChange={(e) => setEditFormData(prev => ({...prev, address_line2: e.target.value}))}
                              className='h-10'
                            />
                          </div>
                          
                          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div className='space-y-2'>
                            <Label htmlFor={`edit-address_city-${address.id}`} className='text-sm font-medium'>City *</Label>
                            <Input
                              id={`edit-address_city-${address.id}`}
                              value={editFormData.address_city}
                              onChange={(e) => setEditFormData(prev => ({...prev, address_city: e.target.value}))}
                                className='h-10'
                              />
                            </div>
                            <div className='space-y-2'>
                            <Label htmlFor={`edit-address_state-${address.id}`} className='text-sm font-medium'>State *</Label>
                            <Input
                              id={`edit-address_state-${address.id}`}
                              value={editFormData.address_state}
                              onChange={(e) => setEditFormData(prev => ({...prev, address_state: e.target.value}))}
                                className='h-10'
                              />
                            </div>
                            <div className='space-y-2'>
                            <Label htmlFor={`edit-address_zip-${address.id}`} className='text-sm font-medium'>Postal Code *</Label>
                            <Input
                              id={`edit-address_zip-${address.id}`}
                              value={editFormData.address_zip}
                              onChange={(e) => setEditFormData(prev => ({...prev, address_zip: e.target.value}))}
                                className='h-10'
                              />
                            </div>
                          </div>
                          
                          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                            <Label htmlFor={`edit-address_country-${address.id}`} className='text-sm font-medium'>Country *</Label>
                            <Select
                              value={editFormData.address_country}
                              onValueChange={(value) => setEditFormData(prev => ({...prev, address_country: value}))}
                              >
                                <SelectTrigger className='h-10'>
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
                            </div>
                            <div className='space-y-2'>
                              <Label htmlFor={`edit-addressType-${address.id}`} className='text-sm font-medium'>Address Type *</Label>
                              <Select
                                value={editFormData.addressType}
                                onValueChange={(value) => setEditFormData(prev => ({...prev, addressType: value}))}
                              >
                                <SelectTrigger className='h-10'>
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
                            </div>
                          </div>
                          
                          <div className='space-y-2'>
                            <Label htmlFor={`edit-label-${address.id}`} className='text-sm font-medium'>Label</Label>
                            <Input
                              id={`edit-label-${address.id}`}
                              value={editFormData.label}
                              onChange={(e) => setEditFormData(prev => ({...prev, label: e.target.value}))}
                              placeholder="e.g., Home, Office, Client ABC"
                              className='h-10'
                            />
                          </div>
                          
                          <div className='flex gap-2 justify-end'>
                            <Button onClick={handleEditCancel} variant='outline' size='sm'>
                              Cancel
                            </Button>
                            <Button onClick={() => handleEditSave(address.id)} size='sm'>
                              Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Display mode
                        <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4'>
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Header with name and badges */}
                            <div className='flex items-center gap-3 flex-wrap'>
                              <h4 className='text-lg font-semibold text-foreground'>{address.contactName}</h4>
                              {address.isDefault && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                  Default Address
                                </span>
                              )}
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                {address.addressType.charAt(0).toUpperCase() + address.addressType.slice(1)}
                              </span>
                            </div>
                            
                            {/* Company name */}
                            {address.companyName && (
                              <p className='text-muted-foreground font-medium'>{address.companyName}</p>
                            )}
                            
                            {/* Address details */}
                            <div className='space-y-1'>
                              <p className='text-foreground'>
                                {address.address_line1}
                                {address.address_line2 && `, ${address.address_line2}`}
                              </p>
                              <p className='text-foreground'>
                                {address.address_city}, {address.address_state} {address.address_zip}, {address.address_country}
                              </p>
                            </div>
                            
                            {/* Additional info */}
                            <div className='flex gap-2 flex-wrap'>
                              {address.label && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                  📍 {address.label}
                                </span>
                              )}
                              {address.usageCount > 0 && (
                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                                  📊 Used {address.usageCount} times
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className='flex gap-2 shrink-0'>
                            <Button 
                              variant='outline' 
                              size='sm' 
                              className='h-9'
                              onClick={() => handleEditClick(address)}
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDelete(address.id)}
                              variant='destructive'
                              size='sm'
                              className='h-9'
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              ) : !allUserAddresses.isLoading && (
                <Card className='p-8 text-center'>
                  <div className='space-y-4'>
                    <div className='text-6xl text-muted-foreground'>📍</div>
                    <div>
                      <h3 className='text-lg font-semibold text-foreground mb-2'>No addresses saved yet</h3>
                      <p className='text-muted-foreground mb-4'>
                        Create your first address above to get started with managing your mail addresses.
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        Saved addresses will appear here for easy access when creating mail jobs.
                      </p>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
