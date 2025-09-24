import React from 'react';
/**
 * Props for the AddressSelector component
 */
interface AddressSelectorProps {
    /** Currently selected address ID */
    selectedAddressId: string | null;
    /** Callback when address selection changes */
    onAddressSelect: (addressId: string | null) => void;
    /** Type of address being selected (sender or recipient) */
    addressType: 'sender' | 'recipient';
    /** Optional CSS classes for styling */
    className?: string;
}
declare const _default: React.NamedExoticComponent<AddressSelectorProps>;
export default _default;
//# sourceMappingURL=AddressSelector.d.ts.map