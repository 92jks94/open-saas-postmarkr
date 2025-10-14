# Data Table Implementation Guide

## ✅ What Was Implemented

### New Components
1. **`src/components/ui/table.tsx`** - Shadcn table primitives
2. **`src/components/ui/data-table.tsx`** - Reusable DataTable component with column visibility
3. **`src/admin/dashboards/users/columns.tsx`** - Column definitions for UsersTable
4. **Updated `src/admin/dashboards/users/UsersTable.tsx`** - Refactored to use TanStack Table

### New Features
✅ **Column Visibility Toggle** - Show/hide columns via dropdown  
✅ **Sortable Columns** - Click headers to sort (client-side)  
✅ **Server-Side Filtering** - Preserved existing email, status, admin filters  
✅ **Server-Side Pagination** - Efficient for large datasets  
✅ **Type-Safe** - Full TypeScript support with Wasp entities  
✅ **Reusable** - Easy to apply to other tables  

---

## 🚀 How to Use for Other Tables

### Step 1: Create Column Definitions

Create a `columns.tsx` file next to your table component:

```typescript
// src/your-feature/columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { type YourEntity } from 'wasp/entities'
import { Button } from '../components/ui/button'

export const yourColumns: ColumnDef<YourEntity>[] = [
  {
    accessorKey: "fieldName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Field Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const value = row.getValue("fieldName") as string
      return <div>{value}</div>
    },
  },
  // Add more columns...
]
```

### Step 2A: Simple Client-Side Table

For small datasets (< 1000 rows), use the generic `DataTable` component:

```typescript
import { DataTable } from '../components/ui/data-table'
import { yourColumns } from './columns'
import { useQuery } from 'wasp/client/operations'
import { getAllYourEntities } from 'wasp/client/operations'

function YourTable() {
  const { data, isLoading } = useQuery(getAllYourEntities)

  if (isLoading) return <div>Loading...</div>

  return (
    <DataTable 
      columns={yourColumns} 
      data={data || []}
      searchable={true}
      searchColumn="name"
      searchPlaceholder="Search by name..."
    />
  )
}
```

### Step 2B: Server-Side Table (Like UsersTable)

For large datasets, use TanStack Table directly with server-side pagination:

```typescript
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { yourColumns } from './columns'

function YourTable() {
  const [currentPage, setCurrentPage] = useState(1)
  const { data } = useQuery(getPaginatedYourEntities, { 
    skipPages: currentPage - 1 
  })

  const table = useReactTable({
    data: data?.items || [],
    columns: yourColumns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Important for server-side
  })

  return (
    <Table>
      <TableHeader>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(header.column.columnDef.header, header.getContext())}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

---

## 🎨 Column Features

### Sortable Column
```typescript
{
  accessorKey: "email",
  header: ({ column }) => (
    <Button
      variant="ghost"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      Email <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  ),
}
```

### Custom Cell Rendering
```typescript
{
  accessorKey: "status",
  cell: ({ row }) => {
    const status = row.getValue("status") as string
    return (
      <Badge variant={status === "active" ? "success" : "secondary"}>
        {status}
      </Badge>
    )
  },
}
```

### Action Column (Non-hideable)
```typescript
{
  id: "actions",
  enableHiding: false, // Can't be hidden
  cell: ({ row }) => {
    return <YourActionButtons data={row.original} />
  },
}
```

### Relationship Data
```typescript
{
  accessorKey: "user.email", // Access nested data
  header: "User Email",
}
```

---

## 🔧 Column Visibility

### Built-in Toggle (Already Added)
```typescript
import { ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuCheckboxItem, ... } from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline">
      Columns <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {table.getAllColumns()
      .filter((column) => column.getCanHide())
      .map((column) => (
        <DropdownMenuCheckboxItem
          key={column.id}
          checked={column.getIsVisible()}
          onCheckedChange={(value) => column.toggleVisibility(!!value)}
        >
          {column.id}
        </DropdownMenuCheckboxItem>
      ))}
  </DropdownMenuContent>
</DropdownMenu>
```

### Persist Visibility in localStorage (Optional)
```typescript
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
  const saved = localStorage.getItem('table-visibility')
  return saved ? JSON.parse(saved) : {}
})

// In useReactTable config
onColumnVisibilityChange: (updater) => {
  const newState = typeof updater === 'function' 
    ? updater(columnVisibility) 
    : updater
  setColumnVisibility(newState)
  localStorage.setItem('table-visibility', JSON.stringify(newState))
}
```

---

## 📊 Row Selection (Optional Feature)

Add checkboxes for bulk actions:

```typescript
// In your columns array
{
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
    />
  ),
}

// In your component
const [rowSelection, setRowSelection] = useState({})

const table = useReactTable({
  // ... other config
  onRowSelectionChange: setRowSelection,
  state: {
    rowSelection,
  },
})

// Access selected rows
const selectedRows = table.getFilteredSelectedRowModel().rows
```

---

## 🔍 Filtering Options

### Client-Side Search (DataTable component)
```typescript
<DataTable
  columns={columns}
  data={data}
  searchable={true}
  searchColumn="email"
  searchPlaceholder="Search emails..."
/>
```

### Custom Filter UI
```typescript
// See UsersTable.tsx for advanced multi-select filter example
const [statusFilter, setStatusFilter] = useState([])

const { data } = useQuery(getPaginatedItems, {
  filter: {
    statusIn: statusFilter.length > 0 ? statusFilter : undefined
  }
})
```

---

## 🎯 Best Practices

### ✅ Do:
- Use server-side pagination for > 1000 rows
- Define columns in separate file for reusability
- Use TypeScript types from `wasp/entities`
- Keep filtering logic in Wasp operations when possible
- Add `enableHiding: false` to critical columns (ID, actions)

### ❌ Don't:
- Mix server-side and client-side pagination
- Fetch all data for large tables
- Hardcode column labels (use descriptive accessorKey)
- Forget loading states

---

## 📦 What's in the Box

### Components Created
- ✅ `table.tsx` - Basic table primitives
- ✅ `data-table.tsx` - Full-featured table with search & visibility
- ✅ `columns.tsx` (example) - Reusable column definitions

### Dependencies Added
- ✅ `@tanstack/react-table` - Core table logic

### Existing Components Used
- Button, Checkbox, Input, Select from Shadcn UI
- Dropdown menus for column toggle
- Wasp's `useQuery` for data fetching

---

## 🚦 Quick Start Checklist

For a new table:
1. [ ] Create `columns.tsx` with your entity type
2. [ ] Decide: client-side or server-side pagination?
3. [ ] Use `DataTable` component or build custom with TanStack
4. [ ] Add column visibility dropdown (copy from UsersTable)
5. [ ] Test with your Wasp query
6. [ ] Add filters if needed (see UsersTable for examples)

---

## 📝 Example: MailPieces Table

Here's how you'd create a table for mail pieces:

```typescript
// src/mail/columns.tsx
import { ColumnDef } from "@tanstack/react-table"
import { type MailPiece } from 'wasp/entities'

export const mailPieceColumns: ColumnDef<MailPiece>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => {
      return new Date(row.getValue("createdAt")).toLocaleDateString()
    },
  },
]

// src/mail/MailPiecesTable.tsx
import { DataTable } from '../components/ui/data-table'
import { mailPieceColumns } from './columns'
import { getAllMailPieces } from 'wasp/client/operations'
import { useQuery } from 'wasp/client/operations'

export default function MailPiecesTable() {
  const { data, isLoading } = useQuery(getAllMailPieces)
  
  if (isLoading) return <div>Loading...</div>
  
  return (
    <DataTable
      columns={mailPieceColumns}
      data={data || []}
      searchable={true}
      searchColumn="id"
    />
  )
}
```

---

## 🆘 Troubleshooting

**Q: Column visibility not working?**  
A: Make sure you don't have `enableHiding: false` on that column.

**Q: Sorting not working?**  
A: Client-side sorting only works for loaded data. For server-side, implement in your Wasp query.

**Q: Type errors on columns?**  
A: Ensure you're importing the correct entity type from `wasp/entities`.

**Q: Table not updating after mutation?**  
A: Wasp automatically refetches queries that depend on mutated entities. Check your `entities: [...]` in main.wasp.

---

Need help? Check the UsersTable implementation at `src/admin/dashboards/users/`

