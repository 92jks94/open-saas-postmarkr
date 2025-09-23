import React from 'react';
interface AddressSelectorProps {
    selectedAddressId: string | null;
    onAddressSelect: (addressId: string | null) => void;
    addressType: 'sender' | 'recipient';
    className?: string;
}
declare const AddressSelector: React.FC<AddressSelectorProps>;
export default AddressSelector;
//# sourceMappingURL=AddressSelector.d.ts.map