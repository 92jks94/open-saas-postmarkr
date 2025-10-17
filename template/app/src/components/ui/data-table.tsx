import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  Row,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"

import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "./dropdown-menu"
import { Input } from "./input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table"
import { ViewModeToggle, ViewMode } from "./view-mode-toggle"
import { CardRenderer } from "./card-renderer"
import { cn } from "../../lib/utils"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchable?: boolean
  searchPlaceholder?: string
  searchColumn?: string
  onRowClick?: (row: TData) => void
  // Card view props
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  cardRenderer?: (row: Row<TData>) => React.ReactNode
  cardClassName?: string
  cardGridClassName?: string
  enableViewToggle?: boolean
  // TanStack Table filtering props
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchable = false,
  searchPlaceholder = "Search...",
  searchColumn,
  onRowClick,
  viewMode: externalViewMode,
  onViewModeChange,
  cardRenderer,
  cardClassName,
  cardGridClassName = "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
  enableViewToggle = false,
  globalFilter,
  onGlobalFilterChange,
  columnFilters,
  onColumnFiltersChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [internalColumnFilters, setInternalColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [internalViewMode, setInternalViewMode] = React.useState<ViewMode>('table')
  const [internalGlobalFilter, setInternalGlobalFilter] = React.useState('')
  
  // Use external view mode if provided, otherwise use internal state
  const currentViewMode = externalViewMode ?? internalViewMode
  const handleViewModeChange = (mode: ViewMode) => {
    if (onViewModeChange) {
      onViewModeChange(mode)
    } else {
      setInternalViewMode(mode)
    }
  }

  // Use external state if provided, otherwise use internal state
  const currentColumnFilters = columnFilters ?? internalColumnFilters
  const currentGlobalFilter = globalFilter ?? internalGlobalFilter

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: onColumnFiltersChange ?? setInternalColumnFilters as any,
    onGlobalFilterChange: onGlobalFilterChange ?? setInternalGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters: currentColumnFilters,
      globalFilter: currentGlobalFilter,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-center py-4 gap-4">
        {/* Left side: Global Search and Faceted Filters */}
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Global Search */}
          <Input
            placeholder={searchPlaceholder}
            value={currentGlobalFilter ?? ""}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="max-w-sm"
          />
          
          {/* Faceted Status Filters */}
          {(() => {
            const statusColumn = table.getColumn('status');
            if (!statusColumn) return null;
            
            const statusFacets = statusColumn.getFacetedUniqueValues();
            const currentStatusFilter = statusColumn.getFilterValue();
            
            return (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={!currentStatusFilter ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => statusColumn.setFilterValue(undefined)}
                >
                  All ({table.getFilteredRowModel().rows.length})
                </Button>
                {Array.from(statusFacets.entries()).map(([status, count]) => (
                  <Button
                    key={status}
                    variant={currentStatusFilter === status ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => statusColumn.setFilterValue(status === currentStatusFilter ? undefined : status)}
                  >
                    {status} ({count})
                  </Button>
                ))}
              </div>
            );
          })()}
        </div>
        
        {/* Right side: View Toggles */}
        <div className="flex items-center gap-2">
          {enableViewToggle && (
            <ViewModeToggle 
              value={currentViewMode} 
              onChange={handleViewModeChange}
            />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                {currentViewMode === 'cards' ? 'Fields' : 'Columns'} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Card View */}
      {currentViewMode === 'cards' ? (
        <>
          {table.getRowModel().rows?.length ? (
            <div className={cardGridClassName}>
              {table.getRowModel().rows.map((row) => (
                <div key={row.id}>
                  {cardRenderer ? (
                    cardRenderer(row)
                  ) : (
                    <CardRenderer 
                      row={row} 
                      className={cardClassName}
                      onClick={onRowClick}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 rounded-md border border-dashed">
              <p className="text-sm text-muted-foreground">No results.</p>
            </div>
          )}
        </>
      ) : (
        // Table View
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onRowClick?.(row.original)}
                    className={onRowClick ? "cursor-pointer" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length > 0 && (
            <span>
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </span>
          )}
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}

