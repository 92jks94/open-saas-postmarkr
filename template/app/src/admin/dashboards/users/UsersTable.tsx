import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getPaginatedUsers, useQuery } from 'wasp/client/operations';
import { type User } from 'wasp/entities';
import useDebounce from '../../../client/hooks/useDebounce';
import { Button } from '../../../components/ui/button';
import { Checkbox } from '../../../components/ui/checkbox';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { SubscriptionStatus } from '../../../payment/plans';
import LoadingSpinner from '../../layout/LoadingSpinner';
import { createUserColumns } from './columns';
import {
  ColumnDef,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"

const UsersTable = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [emailFilter, setEmailFilter] = useState<string | undefined>(undefined);
  const [isAdminFilter, setIsAdminFilter] = useState<boolean | undefined>(undefined);
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<Array<SubscriptionStatus | null>>(
    []
  );
  // Load column visibility from localStorage
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() => {
    const saved = localStorage.getItem('usersTable-columnVisibility');
    return saved ? JSON.parse(saved) : {};
  })
  // Server-side sorting state
  const [serverSort, setServerSort] = useState<{
    field?: 'email' | 'username' | 'subscriptionStatus';
    direction?: 'asc' | 'desc';
  }>({})

  const debouncedEmailFilter = useDebounce(emailFilter, 300);

  const skipPages = currentPage - 1;

  const { data, isLoading } = useQuery(getPaginatedUsers, {
    skipPages,
    filter: {
      ...(debouncedEmailFilter && { emailContains: debouncedEmailFilter }),
      ...(isAdminFilter !== undefined && { isAdmin: isAdminFilter }),
      ...(subscriptionStatusFilter.length > 0 && { subscriptionStatusIn: subscriptionStatusFilter }),
    },
    sortBy: serverSort,
  });

  // Handler for server-side sorting
  const handleSort = (field: 'email' | 'username' | 'subscriptionStatus') => {
    setServerSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const userColumns = createUserColumns(handleSort);

  const table = useReactTable({
    data: data?.users || [],
    columns: userColumns,
    getCoreRowModel: getCoreRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    state: {
      columnVisibility,
    },
    // Server-side pagination and sorting
    manualPagination: true,
    manualSorting: true,
  })

  // Save column visibility to localStorage
  useEffect(() => {
    localStorage.setItem('usersTable-columnVisibility', JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  useEffect(
    function backToPageOne() {
      setCurrentPage(1);
    },
    [debouncedEmailFilter, subscriptionStatusFilter, isAdminFilter]
  );

  const handleStatusToggle = (status: SubscriptionStatus | null) => {
    setSubscriptionStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  const clearAllStatusFilters = () => {
    setSubscriptionStatusFilter([]);
  };

  const hasActiveFilters = subscriptionStatusFilter && subscriptionStatusFilter.length > 0;

  return (
    <div className='flex flex-col gap-4'>
      <div className='rounded-sm border border-border bg-card shadow'>
        {/* Filters Section */}
        <div className='flex-col flex items-start justify-between p-6 gap-3 w-full bg-muted/40'>
          <span className='text-sm font-medium'>Filters:</span>
          <div className='flex items-center justify-between gap-3 w-full px-2'>
            <div className='relative flex items-center gap-3 '>
              <Label htmlFor='email-filter' className='text-sm text-muted-foreground'>
                email:
              </Label>
              <Input
                type='text'
                id='email-filter'
                placeholder='dude@example.com'
                onChange={(e) => {
                  const value = e.currentTarget.value;
                  setEmailFilter(value === '' ? undefined : value);
                }}
              />
              <Label htmlFor='status-filter' className='text-sm ml-2 text-muted-foreground'>
                status:
              </Label>
              <div className='relative'>
                <Select>
                  <SelectTrigger className='w-full min-w-[200px]'>
                    <SelectValue placeholder='Select Status Filter' />
                  </SelectTrigger>
                  <SelectContent className='w-[300px]'>
                    <div className='p-2'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-medium'>Subscription Status</span>
                        {subscriptionStatusFilter.length > 0 && (
                          <button
                            onClick={clearAllStatusFilters}
                            className='text-xs text-muted-foreground hover:text-foreground'
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                      <div className='space-y-2'>
                        <div className='flex items-center space-x-2'>
                          <Checkbox
                            id='all-statuses'
                            checked={subscriptionStatusFilter.length === 0}
                            onCheckedChange={() => clearAllStatusFilters()}
                          />
                          <Label
                            htmlFor='all-statuses'
                            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                          >
                            All Statuses
                          </Label>
                        </div>
                        <div className='flex items-center space-x-2'>
                          <Checkbox
                            id='has-not-subscribed'
                            checked={subscriptionStatusFilter.includes(null)}
                            onCheckedChange={() => handleStatusToggle(null)}
                          />
                          <Label
                            htmlFor='has-not-subscribed'
                            className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                          >
                            Has Not Subscribed
                          </Label>
                        </div>
                        {Object.values(SubscriptionStatus).map((status) => (
                          <div key={status} className='flex items-center space-x-2'>
                            <Checkbox
                              id={status}
                              checked={subscriptionStatusFilter.includes(status)}
                              onCheckedChange={() => handleStatusToggle(status)}
                            />
                            <Label
                              htmlFor={status}
                              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                            >
                              {status}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center gap-2'>
                <Label htmlFor='admin-filter' className='text-sm ml-2 text-muted-foreground'>
                  isAdmin:
                </Label>
                <Select
                  onValueChange={(value) => {
                    if (value === 'both') {
                      setIsAdminFilter(undefined);
                    } else {
                      setIsAdminFilter(value === 'true');
                    }
                  }}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue placeholder='both' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='both'>both</SelectItem>
                    <SelectItem value='true'>true</SelectItem>
                    <SelectItem value='false'>false</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {data?.totalPages && (
              <div className='max-w-60 flex flex-row items-center'>
                <span className='text-md mr-2 text-foreground'>page</span>
                <Input
                  type='number'
                  min={1}
                  defaultValue={currentPage}
                  max={data?.totalPages}
                  onChange={(e) => {
                    const value = parseInt(e.currentTarget.value);
                    if (data?.totalPages && value <= data?.totalPages && value > 0) {
                      setCurrentPage(value);
                    }
                  }}
                  className='w-20'
                />
                <span className='text-md text-foreground'> /{data?.totalPages} </span>
              </div>
            )}
          </div>
          {hasActiveFilters && (
            <div className='flex items-center gap-2 px-2 pt-2 border-border'>
              <span className='text-sm font-medium text-muted-foreground'>Active Filters:</span>
              <div className='flex flex-wrap gap-2'>
                {subscriptionStatusFilter.map((status) => (
                  <Button
                    key={status ?? 'null'}
                    variant='outline'
                    size='sm'
                    onClick={() => handleStatusToggle(status)}
                  >
                    <X className='w-3 h-3 mr-1' />
                    {status ?? 'Has Not Subscribed'}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Column Visibility Toggle */}
        <div className="flex items-center justify-end p-4 border-t border-border">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Columns <ChevronDown className="ml-2 h-4 w-4" />
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

        {/* Table */}
        <div className="rounded-md border-t border-border">
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={userColumns.length} className="h-24 text-center">
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
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
                    colSpan={userColumns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default UsersTable;
