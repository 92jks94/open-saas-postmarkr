import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, getMailAddressesByUser, validateAddress } from 'wasp/client/operations';
import type { MailAddress } from 'wasp/entities';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle, XCircle, MapPin, Plus, AlertTriangle, Shield } from 'lucide-react';

/**
 * Props for the AddressSelector component
 */
export interface AddressSelectorProps {
  /** Currently selected address ID */
  selectedAddressId: string | null;
  /** Callback when address selection changes */
  onAddressSelect: (addressId: string | null) => void;
  /** Type of address being selected (sender or recipient) */
  addressType: 'sender' | 'recipient';
  /** Optional CSS classes for styling */
  className?: string;
}


const AddressSelector: React.FC<AddressSelectorProps> = ({
  selectedAddressId,
  onAddressSelect,
  addressType,
  className = ''
}) => {
  const { data: addresses, isLoading, error } = useQuery(getMailAddressesByUser);
  const [validatingAddresses, setValidatingAddresses] = useState<Set<string>>(new Set());

  // Memoize filtered addresses to prevent recalculation on every render
  const filteredAddresses = useMemo(() => {
    if (!addresses) return [];
    return addresses.filter(address => {
      if (addressType === 'sender') {
        return address.addressType === 'sender' || address.addressType === 'both';
      } else {
        return address.addressType === 'recipient' || address.addressType === 'both';
      }
    });
  }, [addresses, addressType]);

  // Memoize filtered address lists to prevent recalculation on every render
  const validAddresses = useMemo(() => {
    return filteredAddresses.filter(address => {
      return address.isValidated === true;
    });
  }, [filteredAddresses]);

  const invalidAddresses = useMemo(() => {
    return filteredAddresses.filter(address => {
      return address.isValidated === false && address.validationError;
    });
  }, [filteredAddresses]);

  const unverifiedAddresses = useMemo(() => {
    return filteredAddresses.filter(address => {
      return address.isValidated === null || address.isValidated === undefined;
    });
  }, [filteredAddresses]);

  // Validate addresses using Wasp operation - memoized to prevent recreation
  const validateAddressCallback = useCallback(async (address: MailAddress) => {
    if (validatingAddresses.has(address.id)) return;
    
    setValidatingAddresses(prev => new Set(prev).add(address.id));
    
    try {
      // Call the Wasp validateAddress operation
      await validateAddress({ addressId: address.id });
      
      // The operation will update the database, and the query will automatically refetch
      // No need to update local state since we're using the database as source of truth
    } catch (error) {
      console.error('Address validation failed:', error);
      // Error is already handled in the operation and stored in the database
    } finally {
      setValidatingAddresses(prev => {
        const newSet = new Set(prev);
        newSet.delete(address.id);
        return newSet;
      });
    }
  }, [validatingAddresses]);

  // Auto-validate addresses on load
  useEffect(() => {
    if (filteredAddresses.length > 0) {
      filteredAddresses.forEach(address => {
        if (address.isValidated === null || address.isValidated === undefined) {
          validateAddressCallback(address);
        }
      });
    }
  }, [filteredAddresses, validateAddressCallback]);

  // Memoize helper functions to prevent recreation on every render
  const getValidationIcon = useCallback((addressId: string) => {
    const address = filteredAddresses.find(a => a.id === addressId);
    
    if (validatingAddresses.has(addressId)) {
      return <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />;
    }
    
    if (address?.isValidated === true) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    
    if (address?.isValidated === false) {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
    
    return <AlertTriangle className="h-4 w-4 text-gray-400" />;
  }, [filteredAddresses, validatingAddresses]);

  const getValidationBadge = useCallback((addressId: string) => {
    const address = filteredAddresses.find(a => a.id === addressId);
    
    if (validatingAddresses.has(addressId)) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Validating...</Badge>;
    }
    
    if (address?.isValidated === true) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Verified</Badge>;
    }
    
    if (address?.isValidated === false) {
      return <Badge variant="destructive">Invalid</Badge>;
    }
    
    return <Badge variant="outline">Unverified</Badge>;
  }, [filteredAddresses, validatingAddresses]);

  const formatAddress = useCallback((address: MailAddress) => {
    const parts = [
      address.address_line1,
      address.address_line2,
      address.address_city,
      address.address_state,
      address.address_zip,
      address.address_country
    ].filter(Boolean);
    
    return parts.join(', ');
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select {addressType === 'sender' ? 'Sender' : 'Recipient'} Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading addresses...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Select {addressType === 'sender' ? 'Sender' : 'Recipient'} Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load addresses. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Select {addressType === 'sender' ? 'Sender' : 'Recipient'} Address
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose a {addressType === 'sender' ? 'sender' : 'recipient'} address from your address book.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredAddresses.length === 0 ? (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No {addressType} addresses found</p>
            <Button variant="outline" onClick={() => window.location.href = '/addresses'}>
              Manage Addresses
            </Button>
          </div>
        ) : (
          <>
            {/* Valid Addresses */}
            {validAddresses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Verified Addresses</h4>
                {validAddresses.map(address => {
                  const isSelected = selectedAddressId === address.id;
                  
                  return (
                    <div
                      key={address.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => onAddressSelect(isSelected ? null : address.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getValidationIcon(address.id)}
                          <div>
                            <p className="font-medium text-sm">{address.contactName}</p>
                            {address.companyName && (
                              <p className="text-xs text-gray-600">{address.companyName}</p>
                            )}
                            <p className="text-xs text-gray-500">{formatAddress(address)}</p>
                            {address.label && (
                              <p className="text-xs text-blue-600">🏷️ {address.label}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getValidationBadge(address.id)}
                          {address.isDefault && (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                              <Shield className="h-3 w-3 mr-1" />
                              Default
                            </Badge>
                          )}
                          {isSelected && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Unverified Addresses */}
            {unverifiedAddresses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Unverified Addresses</h4>
                {unverifiedAddresses.map(address => {
                  const isSelected = selectedAddressId === address.id;
                  
                  return (
                    <div
                      key={address.id}
                      className={`border border-yellow-200 rounded-lg p-3 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'hover:border-yellow-300'
                      }`}
                      onClick={() => onAddressSelect(isSelected ? null : address.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getValidationIcon(address.id)}
                          <div>
                            <p className="font-medium text-sm">{address.contactName}</p>
                            {address.companyName && (
                              <p className="text-xs text-gray-600">{address.companyName}</p>
                            )}
                            <p className="text-xs text-gray-500">{formatAddress(address)}</p>
                            {address.label && (
                              <p className="text-xs text-blue-600">🏷️ {address.label}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getValidationBadge(address.id)}
                          {isSelected && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs text-yellow-600">
                          ⚠️ This address will be validated before sending
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Invalid Addresses */}
            {invalidAddresses.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Invalid Addresses</h4>
                {invalidAddresses.map(address => {
                  return (
                    <div key={address.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-center gap-3">
                        {getValidationIcon(address.id)}
                        <div>
                          <p className="font-medium text-sm">{address.contactName}</p>
                          {address.companyName && (
                            <p className="text-xs text-gray-600">{address.companyName}</p>
                          )}
                          <p className="text-xs text-gray-500">{formatAddress(address)}</p>
                          <div className="text-xs text-red-600">
                            {address.validationError && (
                              <p>• {address.validationError}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No valid addresses message */}
            {validAddresses.length === 0 && filteredAddresses.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No verified addresses found. Please verify your addresses or add new ones.
                </AlertDescription>
              </Alert>
            )}

            {/* Manage addresses button */}
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/addresses'}
              >
                <Plus className="h-4 w-4 mr-2" />
                Manage Addresses
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// Wrap component with React.memo to prevent re-renders when props haven't changed
export default React.memo(AddressSelector);
