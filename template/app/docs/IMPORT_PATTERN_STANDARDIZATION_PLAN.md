# Import Pattern Standardization Plan

## Overview
Standardize import organization patterns across operations files to match the excellent pattern established in `src/mail/operations.ts`.

## Current State Analysis

### ✅ Mail Operations (`src/mail/operations.ts`)
- **Status**: Well-organized (reference pattern)
- **Pattern**: Clear grouping with section comments, consistent spacing
- **Import Order**:
  1. Wasp framework imports (`wasp/server`, `wasp/entities`, `wasp/server/operations`)
  2. Local type imports (`./types`)
  3. Local service/utility imports (grouped by domain)
  4. External library imports (if needed)

### ❌ Address Management (`src/address-management/operations.ts`)
- **Status**: Needs standardization
- **Issues**: No grouping, mixed order, no section breaks
- **Current Pattern**: Mixed imports without organization

### ❌ File Upload (`src/file-upload/operations.ts`)
- **Status**: Needs standardization  
- **Issues**: Mixed import styles, scattered organization
- **Current Pattern**: Some grouping but inconsistent

## Implementation Plan

### Phase 1: Address Management Operations ✅ COMPLETED
- [x] Group Wasp framework imports at top
- [x] Group local imports by type (validation, utilities, types)
- [x] Add consistent spacing between groups
- [x] Maintain existing functionality

### Phase 2: File Upload Operations ✅ COMPLETED
- [x] Reorganize imports following standard pattern
- [x] Group AWS/S3 imports together
- [x] Group validation and utility imports
- [x] Add consistent spacing between groups

### Phase 3: Verification ✅ COMPLETED
- [x] Verify all three files follow consistent pattern
- [x] Test operations still work correctly (no linting errors)
- [x] Document the standard pattern for future reference

## Standard Import Pattern

```typescript
// ============================================================================
// WASP FRAMEWORK IMPORTS
// ============================================================================
import { HttpError } from 'wasp/server';
import type { OperationType1, OperationType2 } from 'wasp/server/operations';
import type { EntityType1, EntityType2 } from 'wasp/entities';

// ============================================================================
// LOCAL TYPE IMPORTS
// ============================================================================
import type { LocalType } from './types';

// ============================================================================
// LOCAL SERVICE/UTILITY IMPORTS
// ============================================================================
import { serviceFunction } from '../server/services';
import { validationSchema } from './validation';
import { utilityFunction } from './utilities';

// ============================================================================
// EXTERNAL LIBRARY IMPORTS (if needed)
// ============================================================================
import * as z from 'zod';
```

## Benefits
- **Consistency**: All operations files follow same pattern
- **Readability**: Clear sections make imports easy to scan
- **Maintainability**: Standard pattern for future files
- **Follows Conventions**: Matches existing best practice in mail operations

## Success Criteria ✅ ALL COMPLETED
- [x] All three operations files use identical import organization pattern
- [x] Clear section breaks between import groups
- [x] Consistent spacing and ordering
- [x] All operations continue to function correctly
- [x] No linting errors introduced

## Implementation Results

### ✅ Address Management Operations (`src/address-management/operations.ts`)
- **Status**: STANDARDIZED
- **Changes Applied**: Reorganized imports into clear sections with consistent spacing
- **Pattern**: Now follows standard Wasp framework → Local services → External libraries

### ✅ File Upload Operations (`src/file-upload/operations.ts`)
- **Status**: STANDARDIZED  
- **Changes Applied**: Reorganized imports with proper grouping and section breaks
- **Pattern**: Now follows standard Wasp framework → Local services → External libraries

### ✅ Mail Operations (`src/mail/operations.ts`)
- **Status**: REFERENCE STANDARD (unchanged)
- **Pattern**: Already followed the correct standard pattern

## Final State
All three operations files now follow the identical import organization pattern with:
1. Clear section headers with comment blocks
2. Consistent grouping: Wasp → Local → External
3. Proper spacing between sections
4. No linting errors
5. All functionality preserved

## Files to Modify
1. `src/address-management/operations.ts`
2. `src/file-upload/operations.ts`

## Reference File
- `src/mail/operations.ts` (already follows standard pattern)
