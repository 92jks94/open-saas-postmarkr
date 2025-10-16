import React from 'react';
import { CheckCircle, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/button';
import type { MailAddress } from 'wasp/entities';

interface CompactAddressSectionProps {
  address: MailAddress;
  label: string;
  onEdit: () => void;
}

export const CompactAddressSection: React.FC<CompactAddressSectionProps> = ({ address, label, onEdit }) => {
  return (
    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border transition-all duration-200 hover:border-primary/50">
      <div className="flex items-center gap-3">
        <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-medium text-sm">{address.contactName}</p>
            <p className="text-xs text-muted-foreground">
              {address.address_city}, {address.address_state}
            </p>
          </div>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        Change
      </Button>
    </div>
  );
};

