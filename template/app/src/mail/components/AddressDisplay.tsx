import React from 'react';
import { User, MapPin } from 'lucide-react';
import { formatAddressFull } from '../utils';

interface AddressDisplayProps {
  address: {
    contactName: string;
    companyName?: string | null;
    address_line1: string;
    address_line2?: string | null;
    address_city: string;
    address_state: string;
    address_zip: string;
    address_country: string;
  } | null;
  type: 'sender' | 'recipient';
  className?: string;
}

/**
 * Reusable component for displaying addresses with consistent styling
 * Supports both sender and recipient address types with appropriate icons
 */
export const AddressDisplay: React.FC<AddressDisplayProps> = ({
  address,
  type,
  className = ''
}) => {
  const Icon = type === 'sender' ? User : MapPin;
  const label = type === 'sender' ? 'From' : 'To';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      {address ? (
        <div className="pl-6 text-sm text-gray-600 space-y-0.5">
          {formatAddressFull(address).map((line, idx) => (
            <p key={idx}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="pl-6 text-sm text-gray-500">
          No {type === 'sender' ? 'sender' : 'recipient'} address
        </p>
      )}
    </div>
  );
};

export default AddressDisplay;
