# Database Schema Cleanup TODOs

## Deprecated Fields to Remove

### User.hasBetaAccess
- **Status**: Deprecated - kept for migration compatibility
- **Location**: `schema.prisma` line 16
- **Action**: Create migration to remove this field
- **Note**: Currently commented as "Deprecated - kept for migration compatibility"
- **Priority**: Low (safe to remove after confirming no active usage)

## Implementation Notes

When removing deprecated fields:
1. Create a new migration: `wasp db migrate-dev "remove_deprecated_fields"`
2. Update any remaining references in the codebase
3. Test thoroughly to ensure no breaking changes
4. Consider gradual removal if field is still referenced in production data

## Related Files
- `schema.prisma` - Contains deprecated field definitions
- Migration files in `migrations/` directory
