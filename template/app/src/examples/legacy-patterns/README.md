# Legacy Patterns (Reference Only)

⚠️ **WARNING:** These patterns are outdated and should NOT be used in new code. They are preserved here for reference to understand the migration path and historical context.

## What's Here

This folder contains examples of old implementation patterns that have been replaced with modern TanStack Table implementations.

### Why Keep These?

1. **Historical Context** - Understand how the code evolved
2. **Migration Reference** - See what was changed and why
3. **Learning Tool** - Compare old vs new approaches
4. **Debugging** - If you need to understand legacy code

## Deprecated Patterns

### 1. Manual List Rendering ❌

**Old Way (DON'T USE):**
```tsx
{items.map((item) => (
  <div key={item.id} className="grid grid-cols-5 gap-4">
    <div>{item.field1}</div>
    <div>{item.field2}</div>
    <div>{item.field3}</div>
    <div>{item.field4}</div>
    <div>
      <button onClick={() => handleEdit(item.id)}>Edit</button>
      <button onClick={() => handleDelete(item.id)}>Delete</button>
    </div>
  </div>
))}
```

**Problems:**
- Not responsive
- No column control
- Hard to maintain
- Duplicate code
- No accessibility features

### 2. Client-Side Pagination for Large Datasets ❌

**Old Way (DON'T USE):**
```tsx
const { data: allItems } = useQuery(getAllItems); // Loads ALL items!
const pageSize = 20;
const startIndex = (currentPage - 1) * pageSize;
const paginatedItems = allItems?.slice(startIndex, startIndex + pageSize) || [];
```

**Problems:**
- Loads entire dataset upfront
- Slow for large tables (>1000 items)
- Wastes bandwidth
- Poor performance
- Doesn't scale

### 3. Manual Sorting ❌

**Old Way (DON'T USE):**
```tsx
const [sortField, setSortField] = useState('createdAt');
const [sortDirection, setSortDirection] = useState('desc');

const sortedData = [...data].sort((a, b) => {
  if (sortDirection === 'asc') {
    return a[sortField] > b[sortField] ? 1 : -1;
  }
  return a[sortField] < b[sortField] ? 1 : -1;
});
```

**Problems:**
- Only sorts loaded data
- Inefficient (re-sorts on every render)
- Doesn't use database indexes
- Limited to client-side data

### 4. Hardcoded Table Headers ❌

**Old Way (DON'T USE):**
```tsx
<div className="grid grid-cols-5">
  <div className="font-bold">Name</div>
  <div className="font-bold">Email</div>
  <div className="font-bold">Status</div>
  <div className="font-bold">Date</div>
  <div className="font-bold">Actions</div>
</div>
```

**Problems:**
- No column visibility
- No sorting UI
- Hard to change
- Not accessible
- Poor mobile UX

### 5. Inline Edit Forms ❌

**Old Way (DON'T USE):**
```tsx
{isEditing === item.id ? (
  <div>
    <input value={editData.field1} onChange={...} />
    <input value={editData.field2} onChange={...} />
    <button onClick={handleSave}>Save</button>
  </div>
) : (
  <div onClick={() => setIsEditing(item.id)}>
    {item.field1} - {item.field2}
  </div>
)}
```

**Problems:**
- Poor UX (layout shifts)
- Complex state management
- Accessibility issues
- Validation challenges
- Hard to test

## Migration Path

For each legacy pattern, see the modern equivalent:

| Legacy Pattern | Modern Replacement | Example |
|---------------|-------------------|---------|
| Manual rendering | DataTable component | `src/mail/MailHistoryPage.tsx` |
| Client-side pagination | Server-side pagination | `src/address-management/operations.ts` |
| Manual sorting | TanStack sorting | `src/mail/columns.tsx` |
| Hardcoded headers | Column definitions | `src/admin/dashboards/users/columns.tsx` |
| Inline edit forms | Modal dialogs | `src/address-management/AddressManagementPage.tsx` |

## What to Do Instead

👉 **See:** [TanStack Table Patterns](../tanstack-table-patterns/README.md)

Use modern patterns that provide:
- ✅ Server-side pagination
- ✅ Column definitions
- ✅ Built-in sorting
- ✅ Column visibility
- ✅ Type safety
- ✅ Accessibility
- ✅ Performance

## Examples of Migrated Code

### Before: SourcesTable (Analytics)
Located at `src/admin/dashboards/analytics/SourcesTable.tsx` - This still uses the old grid pattern but could be migrated.

**Current (Legacy Pattern):**
```tsx
<div className='grid grid-cols-6'>
  <div>Source</div>
  <div>Visitors</div>
  <div>Conv. Rate</div>
  // ... hardcoded columns
</div>

{sources.map((source) => (
  <div className='grid grid-cols-6'>
    <div>{source.name}</div>
    <div>{source.visitors}</div>
    // ... manual rendering
  </div>
))}
```

**Should Become:**
```tsx
const columns = createSourceColumns();
<DataTable columns={columns} data={sources} />
```

### Before: AddressManagementPage (Now Fixed!)
The old version (689 lines) is saved as `AddressManagementPage.OLD.tsx`.

See the new implementation for comparison.

## Conclusion

These legacy patterns served their purpose but are now replaced with better alternatives. Always use TanStack Table patterns for new table implementations.

**Remember:** If you see these patterns in existing code, they should be migrated when touching that code.

