# TanStack Table Patterns - Best Practices

✅ **USE THESE PATTERNS** for all new table/list implementations.

## Overview

This folder contains production-ready patterns for implementing data tables using TanStack Table with Wasp. All patterns are type-safe, performant, and follow established conventions.

## Quick Decision Tree

```
Need to display a list of data?
│
├─ Small dataset (<100 items)?
│  └─ Use: Client-Side Pagination Pattern
│
└─ Large dataset or needs filtering?
   └─ Use: Server-Side Pagination Pattern
```

## Pattern 1: Server-Side Pagination (Recommended)

**Use When:**
- Dataset might grow large (>100 items)
- Need server-side sorting
- Need complex filtering
- Want optimal performance

**Example:** `src/mail/MailHistoryPage.tsx`

### Step 1: Create Backend Operation

```typescript
// src/feature/operations.ts
import { HttpError } from 'wasp/server';
import type { GetPaginatedItems } from 'wasp/server/operations';
import type { Item } from 'wasp/entities';

type GetPaginatedItemsInput = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
};

export const getPaginatedItems: GetPaginatedItems<
  GetPaginatedItemsInput,
  { items: Item[]; total: number; page: number; totalPages: number }
> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const page = args?.page || 1;
  const limit = Math.min(args?.limit || 20, 100);
  const skip = (page - 1) * limit;

  const where: any = { userId: context.user.id };

  if (args?.search) {
    where.OR = [
      { name: { contains: args.search, mode: 'insensitive' } },
      { description: { contains: args.search, mode: 'insensitive' } },
    ];
  }

  const validSortFields = ['name', 'createdAt', 'status'];
  const orderBy: any = args?.sortBy && validSortFields.includes(args.sortBy)
    ? { [args.sortBy]: args.sortDirection || 'asc' }
    : { createdAt: 'desc' };

  const total = await context.entities.Item.count({ where });
  const items = await context.entities.Item.findMany({
    where,
    orderBy,
    skip,
    take: limit,
  });

  return {
    items,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};
```

### Step 2: Register in main.wasp

```wasp
query getPaginatedItems {
  fn: import { getPaginatedItems } from "@src/feature/operations",
  entities: [Item]
}
```

### Step 3: Create Column Definitions

```typescript
// src/feature/columns.tsx
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Edit, Trash2 } from "lucide-react";
import { Button } from "../components/ui/button";
import type { Item } from "wasp/entities";

export const createItemColumns = (
  onSort?: (field: string) => void,
  onEdit?: (item: Item) => void,
  onDelete?: (id: string) => void
): ColumnDef<Item>[] => [
  {
    accessorKey: "name",
    header: () => {
      return onSort ? (
        <Button variant="ghost" onClick={() => onSort('name')}>
          Name <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) : "Name"
    },
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      return <span className="font-medium">{name}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge>{status}</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: () => {
      return onSort ? (
        <Button variant="ghost" onClick={() => onSort('createdAt')}>
          Created <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) : "Created"
    },
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return <span className="text-sm text-muted-foreground">
        {new Date(date).toLocaleDateString()}
      </span>;
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className="flex gap-2">
          {onEdit && (
            <Button size="sm" variant="outline" onClick={() => onEdit(item)}>
              <Edit className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      );
    },
  },
];
```

### Step 4: Implement in Component

```typescript
// src/feature/ItemsPage.tsx
import { useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { getPaginatedItems } from 'wasp/client/operations';
import { DataTable } from '../components/ui/data-table';
import { createItemColumns } from './columns';

export default function ItemsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [serverSort, setServerSort] = useState<{
    field?: string;
    direction?: 'asc' | 'desc';
  }>({});

  const { data, isLoading, refetch } = useQuery(getPaginatedItems, {
    page: currentPage,
    limit: 20,
    sortBy: serverSort.field,
    sortDirection: serverSort.direction,
  });

  const handleSort = (field: string) => {
    setServerSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1);
  };

  const handleDelete = async (id: string) => {
    // await deleteItem({ id });
    refetch();
  };

  const columns = createItemColumns(handleSort, undefined, handleDelete);

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <DataTable columns={columns} data={data?.items || []} />
      
      {/* Pagination Controls */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages} ({data.total} total)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= data.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## Pattern 2: Client-Side Pagination

**Use When:**
- Dataset is guaranteed small (<100 items)
- No server-side sorting needed
- Simple use case

**Example:**
```typescript
import { useQuery } from 'wasp/client/operations';
import { getAllItems } from 'wasp/client/operations';
import { DataTable } from '../components/ui/data-table';
import { createItemColumns } from './columns';

export default function SimpleItemsPage() {
  const { data, isLoading } = useQuery(getAllItems);
  const columns = createItemColumns();

  if (isLoading) return <LoadingSpinner />;

  return (
    <DataTable
      columns={columns}
      data={data || []}
      searchable={true}
      searchColumn="name"
      searchPlaceholder="Search items..."
    />
  );
}
```

**Note:** DataTable component handles pagination internally for client-side mode.

---

## Pattern 3: Card/Table View Toggle

**Use When:**
- Display needs different formats (cards for mobile, table for desktop)
- Want to give users choice

**Example:** `src/mail/MailHistoryPage.tsx`

```typescript
import { useState } from 'react';
import { ViewMode } from '../components/ui/view-mode-toggle';

export default function ItemsPageWithCards() {
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  return (
    <DataTable
      columns={columns}
      data={data || []}
      enableViewToggle={true}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      cardRenderer={(row) => <CustomItemCard row={row} />}
      cardGridClassName="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
    />
  );
}
```

---

## Pattern 4: Custom Card Renderer

**Use When:**
- Need custom card layout
- Want to show more detail in card view

```typescript
// src/feature/components/ItemCard.tsx
import { Row } from "@tanstack/react-table";
import { Card, CardContent } from "../../components/ui/card";
import type { Item } from "wasp/entities";

interface ItemCardProps {
  row: Row<Item>;
  onDelete?: (id: string) => void;
}

export function ItemCard({ row, onDelete }: ItemCardProps) {
  const item = row.original;
  const visibleCells = row.getVisibleCells();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-semibold text-lg">{item.name}</h3>
          <Badge>{item.status}</Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          {visibleCells
            .filter(cell => !['name', 'status', 'actions'].includes(cell.column.id))
            .map(cell => {
              const header = cell.column.columnDef.header;
              const headerText = typeof header === 'string' ? header : cell.column.id;
              
              return (
                <div key={cell.id}>
                  <span className="text-xs font-medium text-muted-foreground uppercase">
                    {headerText}
                  </span>
                  <div className="mt-1">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </div>
              );
            })}
        </div>
        
        {onDelete && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" onClick={() => navigate(`/items/${item.id}`)}>
              View Details
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onDelete(item.id)}>
              Delete
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Best Practices

### ✅ DO:
1. **Always use TypeScript** - Leverage Wasp's generated types
2. **Separate concerns** - Column definitions in separate file
3. **Use factory pattern** - Columns accept handler functions
4. **Server-side for scale** - Use server-side pagination for large datasets
5. **Validate sort fields** - Whitelist acceptable sort fields in backend
6. **Limit page size** - Max 100 items per page
7. **Handle errors** - Show user-friendly error messages
8. **Loading states** - Display spinners during fetches
9. **Accessible** - Use semantic HTML and ARIA labels
10. **Responsive** - Test on mobile, tablet, desktop

### ❌ DON'T:
1. **Don't fetch all data** - Use pagination for large datasets
2. **Don't skip type safety** - Always use Wasp entity types
3. **Don't hardcode** - Use column definitions instead
4. **Don't forget errors** - Always handle error states
5. **Don't ignore UX** - Empty states, loading states matter
6. **Don't mix patterns** - Server-side OR client-side, not both
7. **Don't forget mobile** - Always test responsive design
8. **Don't skip validation** - Validate all user inputs
9. **Don't disable features** - Unless there's a good reason
10. **Don't forget docs** - Comment complex logic

---

## Column Configuration Examples

### Sortable Column
```typescript
{
  accessorKey: "fieldName",
  header: () => onSort ? (
    <Button variant="ghost" onClick={() => onSort('fieldName')}>
      Label <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ) : "Label",
}
```

### Custom Cell Rendering
```typescript
{
  accessorKey: "status",
  header: "Status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string;
    return <Badge variant={getStatusVariant(status)}>{status}</Badge>;
  },
}
```

### Formatted Numbers
```typescript
{
  accessorKey: "price",
  header: "Price",
  cell: ({ row }) => {
    const price = row.getValue("price") as number;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  },
}
```

### Formatted Dates
```typescript
{
  accessorKey: "createdAt",
  header: "Created",
  cell: ({ row }) => {
    const date = row.getValue("createdAt") as Date;
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
}
```

### Non-Hideable Actions Column
```typescript
{
  id: "actions",
  enableHiding: false,
  cell: ({ row }) => {
    return <ActionsDropdown item={row.original} />;
  },
}
```

---

## Testing Checklist

Before deploying a new table implementation:

- [ ] Pagination works correctly
- [ ] Sorting works (if implemented)
- [ ] Search works (if implemented)
- [ ] Column visibility toggle works
- [ ] Actions (edit/delete) work correctly
- [ ] Loading states display properly
- [ ] Empty states display properly
- [ ] Error states display properly
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] Performance is acceptable

---

## Common Issues & Solutions

### Issue: Types not updating
**Solution:** Restart Wasp dev server (`wasp start`)

### Issue: Query not refetching
**Solution:** Ensure entities are listed in `main.wasp` query definition

### Issue: Sorting not working
**Solution:** Check that field is in `validSortFields` array in backend

### Issue: Column visibility not persisting
**Solution:** Add localStorage persistence (see UsersTable example)

### Issue: Table too wide on mobile
**Solution:** Use card view for mobile, table for desktop

---

## References

- [TanStack Table Docs](https://tanstack.com/table/v8/docs/introduction)
- [Wasp Documentation](https://wasp-lang.dev/docs)
- [Data Table Usage Guide](../../../docs/DATA_TABLE_USAGE_GUIDE.md)
- [Migration Complete Summary](../../../docs/TANSTACK_MIGRATION_COMPLETE.md)

---

**Remember:** These patterns are battle-tested and production-ready. Copy them with confidence!

