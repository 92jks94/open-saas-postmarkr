# Code Examples and Patterns

This directory contains reference implementations and patterns for common development tasks in the application.

## Directory Structure

### `/legacy-patterns`
Contains examples of old implementation patterns that have been replaced. These are kept for reference and to help understand the migration path.

**Purpose:** Historical reference only - do NOT use these patterns in new code

### `/tanstack-table-patterns`
Contains best practice examples for implementing tables and data lists using TanStack Table.

**Purpose:** Copy these patterns for new table implementations

## Quick Links

- [TanStack Table Patterns](./tanstack-table-patterns/README.md) - Modern table implementation
- [Legacy Patterns](./legacy-patterns/README.md) - Old patterns (reference only)

## When to Use What

### Use TanStack Table Patterns When:
- Displaying lists of data (any entity)
- Need pagination, sorting, or filtering
- Want column visibility controls
- Need card/table view toggle
- Building any CRUD list view

### Avoid Legacy Patterns:
- Manual list rendering with `.map()`
- Client-side pagination for large datasets
- Hardcoded column layouts
- Inline sorting logic

## Getting Started

1. Review the [TanStack Table Patterns README](./tanstack-table-patterns/README.md)
2. Choose the appropriate example (server-side vs client-side)
3. Copy the pattern to your feature directory
4. Customize column definitions for your entity
5. Connect to your Wasp query

## Reference Implementations

Live examples in the codebase:
- **Mail History** (`src/mail/MailHistoryPage.tsx`) - Server-side pagination with sorting
- **Address Management** (`src/address-management/AddressManagementPage.tsx`) - Modal forms with table
- **Users Table** (`src/admin/dashboards/users/UsersTable.tsx`) - Server-side with filters

## Need Help?

- Check the [Data Table Usage Guide](../../docs/DATA_TABLE_USAGE_GUIDE.md)
- Review the [Migration Complete Summary](../../docs/TANSTACK_MIGRATION_COMPLETE.md)
- Look at working examples in the codebase

