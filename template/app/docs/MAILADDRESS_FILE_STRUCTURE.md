# MailAddress CRUD Operations - File Structure

## Directory Structure
```
src/
├── address-management/
│   ├── operations.ts                    # Core CRUD operations
│   ├── AddressManagementPage.tsx        # Main address management UI
│   ├── types.ts                         # TypeScript type definitions
│   ├── validation.ts                    # Zod validation schemas
│   ├── components/
│   │   ├── AddressForm.tsx              # Reusable address form
│   │   ├── AddressCard.tsx             # Address display card
│   │   ├── AddressSelector.tsx         # Address selection dropdown
│   │   ├── AddressList.tsx              # Address list with search
│   │   └── AddressSearch.tsx            # Search and filter component
│   └── services/
│       ├── addressValidation.ts         # Lob API integration
│       └── addressUtils.ts              # Utility functions
├── components/ui/                       # Existing Shadcn UI components
└── lib/
    └── utils.ts                         # Existing utility functions
```

## File Relationships

### Core Operations Flow
```
AddressManagementPage.tsx
    ↓ (uses)
AddressForm.tsx + AddressCard.tsx + AddressList.tsx
    ↓ (calls)
operations.ts
    ↓ (validates with)
validation.ts
    ↓ (integrates with)
addressValidation.ts (Lob API)
```

### Data Flow
```
User Input → AddressForm.tsx → validation.ts → operations.ts → Database
                ↓
        AddressCard.tsx ← operations.ts ← Database
                ↓
        AddressSelector.tsx (for mail creation)
```

## Component Hierarchy

### AddressManagementPage.tsx
- **Parent**: Main page component
- **Children**: 
  - AddressSearch.tsx (search/filter)
  - AddressList.tsx (address display)
  - AddressForm.tsx (add/edit modal)
- **Props**: None (gets data from operations)
- **State**: Search filters, selected address, form visibility

### AddressForm.tsx
- **Parent**: AddressManagementPage.tsx (modal)
- **Children**: Form fields, validation messages
- **Props**: 
  - `address?: MailAddress` (for editing)
  - `onSubmit: (data: MailAddressInput) => void`
  - `onCancel: () => void`
- **State**: Form data, validation errors, submission status

### AddressCard.tsx
- **Parent**: AddressList.tsx
- **Children**: Action buttons, status indicators
- **Props**:
  - `address: MailAddress`
  - `onEdit: (id: string) => void`
  - `onDelete: (id: string) => void`
  - `onSetDefault: (id: string) => void`
- **State**: Loading states for actions

### AddressSelector.tsx
- **Parent**: Mail creation forms (future)
- **Children**: Dropdown, search input, address preview
- **Props**:
  - `addressType: 'sender' | 'recipient'`
  - `onSelect: (address: MailAddress) => void`
  - `value?: MailAddress`
- **State**: Search query, filtered addresses

## Operation Functions

### operations.ts Functions
1. **createMailAddress**
   - Input: `MailAddressInput`
   - Output: `MailAddress`
   - Validation: Required fields, unique constraints
   - Side effects: Set default if first address

2. **getMailAddressesByUser**
   - Input: `AddressSearchFilters`
   - Output: `MailAddress[]`
   - Features: Filtering, sorting, pagination

3. **getMailAddressById**
   - Input: `{id: string}`
   - Output: `MailAddress`
   - Security: User ownership validation

4. **updateMailAddress**
   - Input: `{id: string, data: MailAddressUpdate}`
   - Output: `MailAddress`
   - Validation: Business rules, default address handling

5. **deleteMailAddress**
   - Input: `{id: string}`
   - Output: `MailAddress`
   - Side effects: Cascade handling, default address reassignment

6. **setDefaultAddress**
   - Input: `{id: string}`
   - Output: `MailAddress`
   - Side effects: Unset previous default

## Integration Points

### Wasp Configuration (main.wasp)
```wasp
// Routes
route AddressManagementRoute { path: "/addresses", to: AddressManagementPage }

// Operations
action createMailAddress { fn: import { createMailAddress } from "@src/address-management/operations" }
query getMailAddressesByUser { fn: import { getMailAddressesByUser } from "@src/address-management/operations" }
action updateMailAddress { fn: import { updateMailAddress } from "@src/address-management/operations" }
action deleteMailAddress { fn: import { deleteMailAddress } from "@src/address-management/operations" }
action setDefaultAddress { fn: import { setDefaultAddress } from "@src/address-management/operations" }
```

### Database Integration
- **Entity**: `MailAddress` (already created)
- **Relationships**: `User` → `MailAddress[]`
- **Indexes**: Performance optimization for queries

### External API Integration
- **Lob API**: Address validation service
- **Rate Limiting**: Prevent API abuse
- **Caching**: Reduce API calls
- **Error Handling**: Graceful degradation

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Create operations.ts with basic CRUD
- [ ] Add Wasp configuration
- [ ] Create basic types and validation
- [ ] Test operations manually

### Phase 2: UI Components (Week 2)
- [ ] AddressManagementPage.tsx
- [ ] AddressForm.tsx
- [ ] AddressCard.tsx
- [ ] Basic styling and layout

### Phase 3: Advanced Features (Week 3)
- [ ] AddressSelector.tsx
- [ ] Search and filtering
- [ ] Lob API integration
- [ ] Address validation

### Phase 4: Polish & Integration (Week 4)
- [ ] Error handling and loading states
- [ ] Mobile responsiveness
- [ ] Testing and bug fixes
- [ ] Integration with mail creation

## Success Metrics

### Technical Metrics
- ✅ All CRUD operations working
- ✅ Address validation integrated
- ✅ Search/filter functionality
- ✅ Mobile-responsive design

### User Experience Metrics
- ✅ Intuitive address management
- ✅ Fast search and filtering
- ✅ Clear validation feedback
- ✅ Smooth form interactions

### Performance Metrics
- ✅ Operations complete <500ms
- ✅ Search responds <200ms
- ✅ Supports 1000+ addresses
- ✅ Lob API integration <2s

---
**Total Files to Create**: 9 files
**Estimated Development Time**: 4 weeks
**Priority**: High (Foundation for mail creation)
