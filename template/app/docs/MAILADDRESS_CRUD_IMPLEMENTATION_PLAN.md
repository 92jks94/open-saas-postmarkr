# MailAddress CRUD Operations Implementation Plan (Updated)

## Overview
Creating comprehensive CRUD operations for MailAddress management leveraging existing infrastructure and patterns from the file-upload system.

## Existing Infrastructure Analysis ✅

### 🎨 **UI Components Available (Shadcn UI)**
- ✅ `Button`, `Card`, `Input`, `Label`, `Alert` - Perfect for forms and cards
- ✅ `Select`, `Checkbox`, `Switch` - For dropdowns and toggles
- ✅ `Form`, `Textarea` - For complex forms
- ✅ `DropdownMenu`, `Sheet` - For modals and actions
- ✅ `Progress` - For loading states
- ✅ `Separator` - For visual separation

### 🔧 **Existing Patterns to Follow**
- ✅ **File Upload Operations Pattern** - `src/file-upload/operations.ts` structure
- ✅ **Validation Pattern** - `src/server/validation.ts` with `ensureArgsSchemaOrThrowHttpError`
- ✅ **Zod Schemas** - Already used in file upload validation
- ✅ **Error Handling** - `HttpError` from `wasp/server`
- ✅ **Entity Types** - Import from `wasp/entities`
- ✅ **Client Operations** - Import from `wasp/client/operations`

### 📁 **Directory Structure Pattern**
- ✅ **Feature-based organization** - `src/file-upload/` structure
- ✅ **Operations file** - `operations.ts` for all CRUD operations
- ✅ **Validation file** - `validation.ts` for Zod schemas
- ✅ **Types file** - `types.ts` for TypeScript definitions
- ✅ **Page component** - `{Feature}Page.tsx` for main UI

## Files to be Created/Modified (Simplified)

### 1. Core Operations (`src/address-management/operations.ts`)
**Purpose**: Follow exact pattern from `src/file-upload/operations.ts`
**Leverages**: 
- ✅ Existing validation pattern (`ensureArgsSchemaOrThrowHttpError`)
- ✅ Existing error handling (`HttpError`)
- ✅ Existing entity access pattern (`context.entities.MailAddress`)

### 2. Address Management Page (`src/address-management/AddressManagementPage.tsx`)
**Purpose**: Follow pattern from `src/file-upload/FileUploadPage.tsx`
**Leverages**:
- ✅ Existing UI components (Card, Button, Input, Alert)
- ✅ Existing `useQuery` pattern for data fetching
- ✅ Existing error state management
- ✅ Existing loading state patterns

### 3. Address Form Component (`src/address-management/components/AddressForm.tsx`)
**Purpose**: Reusable form using existing UI components
**Leverages**:
- ✅ Existing Form, Input, Label, Button components
- ✅ Existing Select component for dropdowns
- ✅ Existing validation patterns

### 4. Address Card Component (`src/address-management/components/AddressCard.tsx`)
**Purpose**: Display cards using existing Card component
**Leverages**:
- ✅ Existing Card, CardContent, CardTitle components
- ✅ Existing Button variants (outline, destructive)
- ✅ Existing Badge patterns from file upload

### 5. Validation Schema (`src/address-management/validation.ts`)
**Purpose**: Follow pattern from `src/file-upload/validation.ts`
**Leverages**:
- ✅ Existing Zod schema patterns
- ✅ Existing validation constants pattern

### 6. Types (`src/address-management/types.ts`)
**Purpose**: Follow pattern from `src/file-upload/types.ts`
**Leverages**:
- ✅ Existing type definition patterns
- ✅ Existing interface structures

### 7. Wasp Configuration (`main.wasp`)
**Purpose**: Follow exact pattern from File Upload section
**Leverages**:
- ✅ Existing route/page pattern
- ✅ Existing operation definitions
- ✅ Existing entity relationships

## Detailed Implementation Plan (Leveraging Existing Patterns)

### Phase 1: Core Operations (Week 1) - Copy File Upload Pattern

#### 1.1 Create Operations File (Copy from file-upload pattern)
```typescript
// src/address-management/operations.ts
// EXACTLY following src/file-upload/operations.ts pattern:

import * as z from 'zod';
import { HttpError } from 'wasp/server';
import { type MailAddress } from 'wasp/entities';
import {
  type CreateMailAddress,
  type DeleteMailAddress,
  type GetMailAddressesByUser,
  type UpdateMailAddress,
} from 'wasp/server/operations';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

// Copy the exact validation pattern from file-upload
const createMailAddressInputSchema = z.object({
  contactName: z.string().nonempty(),
  companyName: z.string().optional(),
  addressLine1: z.string().nonempty(),
  addressLine2: z.string().optional(),
  city: z.string().nonempty(),
  state: z.string().nonempty(),
  postalCode: z.string().nonempty(),
  country: z.string().nonempty(),
  label: z.string().optional(),
  addressType: z.enum(['sender', 'recipient', 'both']).default('both'),
});

type CreateMailAddressInput = z.infer<typeof createMailAddressInputSchema>;

export const createMailAddress: CreateMailAddress<CreateMailAddressInput, MailAddress> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const data = ensureArgsSchemaOrThrowHttpError(createMailAddressInputSchema, rawArgs);

  // Follow exact same pattern as createFile
  const address = await context.entities.MailAddress.create({
    data: {
      ...data,
      user: { connect: { id: context.user.id } },
    },
  });

  return address;
};

// Copy getAllFilesByUser pattern exactly
export const getMailAddressesByUser: GetMailAddressesByUser<void, MailAddress[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.MailAddress.findMany({
    where: {
      user: {
        id: context.user.id,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

// Copy deleteFile pattern exactly
export const deleteMailAddress: DeleteMailAddress<{id: string}, MailAddress> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { id } = ensureArgsSchemaOrThrowHttpError(z.object({id: z.string().nonempty()}), rawArgs);

  return context.entities.MailAddress.delete({
    where: {
      id,
      user: {
        id: context.user.id,
      },
    },
  });
};
```

#### 1.2 Add to main.wasp (Copy File Upload Section Pattern)
```wasp
//#region Address Management
route AddressManagementRoute { path: "/addresses", to: AddressManagementPage }
page AddressManagementPage {
  authRequired: true,
  component: import AddressManagementPage from "@src/address-management/AddressManagementPage"
}

action createMailAddress {
  fn: import { createMailAddress } from "@src/address-management/operations",
  entities: [User, MailAddress]
}

query getMailAddressesByUser {
  fn: import { getMailAddressesByUser } from "@src/address-management/operations",
  entities: [User, MailAddress]
}

action deleteMailAddress {
  fn: import { deleteMailAddress } from "@src/address-management/operations",
  entities: [User, MailAddress]
}
//#endregion
```

### Phase 2: UI Components (Week 2) - Copy FileUploadPage Pattern

#### 2.1 Address Management Page (Copy FileUploadPage.tsx Structure)
```typescript
// src/address-management/AddressManagementPage.tsx
// EXACTLY following src/file-upload/FileUploadPage.tsx pattern:

import { FormEvent, useEffect, useState } from 'react';
import { getMailAddressesByUser, deleteMailAddress, useQuery } from 'wasp/client/operations';
import type { MailAddress } from 'wasp/entities';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { cn } from '../lib/utils';

export default function AddressManagementPage() {
  const [addressError, setAddressError] = useState<string | null>(null);

  // Copy exact useQuery pattern from FileUploadPage
  const allUserAddresses = useQuery(getMailAddressesByUser, undefined, {
    enabled: false, // Same pattern as file upload
  });

  useEffect(() => {
    allUserAddresses.refetch();
  }, []);

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

        {/* Copy exact Card structure from FileUploadPage */}
        <Card className='my-8'>
          <CardContent className='space-y-10 my-10 py-8 px-4 mx-auto sm:max-w-lg'>
            {/* Address form will go here */}
            
            <div className='border-b-2 border-border'></div>
            
            {/* Copy exact address list pattern from file list */}
            <div className='space-y-4 col-span-full'>
              <CardTitle className='text-xl font-bold text-foreground'>Saved Addresses</CardTitle>
              {allUserAddresses.isLoading && <p className='text-muted-foreground'>Loading...</p>}
              {allUserAddresses.error && (
                <Alert variant='destructive'>
                  <AlertDescription>Error: {allUserAddresses.error.message}</AlertDescription>
                </Alert>
              )}
              {!!allUserAddresses.data && allUserAddresses.data.length > 0 && !allUserAddresses.isLoading ? (
                <div className='space-y-3'>
                  {allUserAddresses.data.map((address: MailAddress) => (
                    <Card key={address.id} className='p-4'>
                      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
                        <div className="flex-1 min-w-0">
                          <p className='text-foreground font-medium'>{address.contactName}</p>
                          {address.companyName && (
                            <p className='text-muted-foreground text-sm'>{address.companyName}</p>
                          )}
                          <p className='text-muted-foreground text-sm'>
                            {address.addressLine1}, {address.city}, {address.state} {address.postalCode}
                          </p>
                        </div>
                        <div className='flex gap-2'>
                          <Button variant='outline' size='sm'>Edit</Button>
                          <Button
                            onClick={() => handleDelete(address.id)}
                            variant='destructive'
                            size='sm'
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className='text-muted-foreground text-center'>No addresses saved yet :(</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

#### 2.2 Address Form Component (Use Existing UI Components)
- ✅ Use existing `Form`, `Input`, `Label`, `Button` components
- ✅ Use existing `Select` component for country/state dropdowns
- ✅ Use existing `Alert` component for validation errors
- ✅ Follow exact form pattern from file upload

#### 2.3 Address Card Component (Use Existing Card Components)
- ✅ Use existing `Card`, `CardContent`, `CardTitle` components
- ✅ Use existing `Button` variants (outline, destructive)
- ✅ Copy exact card structure from file upload cards

### Phase 3: Advanced Features (Week 3)

#### 3.1 Address Validation Integration
- Lob API integration
- Validation status tracking
- Error handling and retry logic
- Validation caching

#### 3.2 Address Selection Components
- Dropdown selectors for mail creation
- Recent addresses quick access
- Address search functionality
- Integration with mail creation workflow

#### 3.3 Analytics and Usage Tracking
- Address usage statistics
- Popular addresses tracking
- Usage patterns analysis
- Performance metrics

### Phase 4: Integration and Testing (Week 4)

#### 4.1 Mail Creation Integration
- Address selection in mail creation flow
- Default address handling
- Address validation in mail workflow

#### 4.2 Testing
- Unit tests for operations
- Integration tests for UI components
- End-to-end tests for address management flow
- Performance testing for large address books

## Technical Specifications

### Database Operations
- **Create**: Validate input, check for duplicates, set default if first address
- **Read**: Support filtering by type, validation status, usage patterns
- **Update**: Validate changes, handle default address conflicts
- **Delete**: Soft delete with cascade handling for mail jobs

### Validation Rules
- **Required Fields**: contactName, addressLine1, city, state, postalCode, country
- **Format Validation**: Postal codes per country, state codes
- **Business Rules**: Only one default sender address per user
- **Lob Integration**: Real-time address verification

### Performance Considerations
- **Indexing**: Optimize queries with proper database indexes
- **Caching**: Cache validation results to reduce API calls
- **Pagination**: Handle large address books efficiently
- **Search**: Implement efficient search across address fields

### Security Considerations
- **User Isolation**: Ensure users can only access their own addresses
- **Input Sanitization**: Prevent injection attacks
- **Rate Limiting**: Limit Lob API calls per user
- **Data Privacy**: Handle sensitive address information securely

## What We're NOT Reinventing ✅

### 🎨 **UI Components (Already Available)**
- ✅ **All Form Components** - Input, Label, Button, Select, Checkbox, Switch
- ✅ **All Card Components** - Card, CardContent, CardTitle for address display
- ✅ **All Alert Components** - Alert, AlertDescription for error handling
- ✅ **All Layout Components** - Separator, Progress, DropdownMenu, Sheet
- ✅ **All Styling** - Tailwind classes, responsive design patterns

### 🔧 **Backend Patterns (Already Established)**
- ✅ **Validation Pattern** - `ensureArgsSchemaOrThrowHttpError` from `src/server/validation.ts`
- ✅ **Error Handling** - `HttpError` from `wasp/server`
- ✅ **Entity Access** - `context.entities.MailAddress` pattern
- ✅ **Zod Schemas** - Already used in file upload validation
- ✅ **Type Safety** - Import types from `wasp/entities` and `wasp/server/operations`

### 📱 **Frontend Patterns (Already Working)**
- ✅ **useQuery Pattern** - Exact same pattern as `getAllFilesByUser`
- ✅ **State Management** - Error states, loading states, refetch patterns
- ✅ **Form Handling** - Form submission, validation, error display
- ✅ **Card Layout** - Exact same structure as file upload cards
- ✅ **Button Actions** - Edit, delete, action button patterns

### 🗂️ **File Structure (Already Organized)**
- ✅ **Feature Directories** - `src/file-upload/` pattern to copy
- ✅ **Operations File** - `operations.ts` for all CRUD operations
- ✅ **Validation File** - `validation.ts` for Zod schemas
- ✅ **Types File** - `types.ts` for TypeScript definitions
- ✅ **Page Component** - `{Feature}Page.tsx` naming convention

### ⚙️ **Wasp Configuration (Already Patterned)**
- ✅ **Route/Page Pattern** - Exact same as file upload section
- ✅ **Operation Definitions** - Same structure as file operations
- ✅ **Entity Relationships** - Same pattern as User/File relationship
- ✅ **Auth Requirements** - Same `authRequired: true` pattern

## Success Criteria (Leveraging Existing Infrastructure)

### Functional Requirements
- ✅ Users can create, read, update, delete addresses (using existing CRUD patterns)
- ✅ Address validation with Lob API integration (new feature)
- ✅ Default address management (new feature)
- ✅ Address book organization and search (using existing UI components)
- ✅ Integration with mail creation workflow (future phase)

### Performance Requirements
- ✅ Address operations complete within 500ms (same as file operations)
- ✅ Search functionality responds within 200ms (using existing patterns)
- ✅ Support for 1000+ addresses per user (same database patterns)
- ✅ Lob API integration with <2s response time (new external service)

### User Experience Requirements
- ✅ Intuitive address management interface (using existing UI components)
- ✅ Real-time validation feedback (using existing Alert components)
- ✅ Mobile-responsive design (using existing Tailwind patterns)
- ✅ Accessibility compliance (inherited from existing components)

## Dependencies

### External Services
- **Lob API**: Address validation service
- **Country/State Data**: Reference data for validation

### Internal Dependencies
- **User Authentication**: Existing Wasp auth system
- **Database**: PostgreSQL with MailAddress model
- **UI Components**: Existing Shadcn UI components

### Development Dependencies
- **TypeScript**: Type safety and development experience
- **Zod**: Runtime validation
- **React Hook Form**: Form management
- **Testing**: Jest, React Testing Library

## Risk Mitigation

### Technical Risks
- **Lob API Rate Limits**: Implement caching and retry logic
- **Address Validation Accuracy**: Provide manual override options
- **Performance with Large Address Books**: Implement pagination and indexing

### Business Risks
- **User Adoption**: Focus on intuitive UX and clear value proposition
- **Data Migration**: Plan for existing user data migration
- **Compliance**: Ensure address data handling meets privacy requirements

## Next Steps After CRUD Implementation

1. **Mail Creation Integration**: Integrate address selection into mail creation workflow
2. **Advanced Address Features**: Bulk import/export, address templates
3. **Analytics Dashboard**: Address usage analytics and insights
4. **Mobile App**: Native mobile app for address management
5. **API Integration**: Third-party integrations for address data

---
**Estimated Timeline**: 4 weeks
**Priority**: High - Foundation for mail creation workflow
**Dependencies**: MailAddress model (✅ Completed)
