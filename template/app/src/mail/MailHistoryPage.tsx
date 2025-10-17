import React, { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getMailPieces, deleteMailPiece } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { ColumnFiltersState } from '@tanstack/react-table';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { PageLoadingSpinner, MailPieceSkeletonGrid } from '../components/ui/loading-spinner';
import { EmptyMailState } from '../components/ui/empty-state';
import { PageHeader } from '../components/ui/page-header';
import { DataTable } from '../components/ui/data-table';
import { ViewMode } from '../components/ui/view-mode-toggle';
import { createMailPieceColumns, MailPieceWithRelations } from './columns';
import { MailPieceCard } from './components/MailPieceCard';
import { cn } from '../lib/utils';

/**
 * Enhanced mail history page using TanStack Table with server-side pagination
 * 
 * Features:
 * - Server-side pagination for optimal performance
 * - Server-side sorting
 * - Table and card view modes
 * - Configurable field/column visibility
 * - Search and filter capabilities
 */
export default function MailHistoryPage() {
  const { data: user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  
  // Server-side pagination and sorting state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [serverSort, setServerSort] = useState<{
    field?: string;
    direction?: 'asc' | 'desc';
  }>({ field: 'createdAt', direction: 'desc' }); // Default: newest first

  // TanStack Table state for client-side filtering
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const { data: mailData, isLoading, error, refetch } = useQuery(getMailPieces, {
    page: currentPage,
    limit: pageSize,
    status: 'all', // Let TanStack handle filtering
    mailType: 'all',
    search: '', // Let TanStack handle search
    sortBy: serverSort.field,
    sortDirection: serverSort.direction,
  });

  const mailPieces = mailData?.mailPieces || [];

  const handleDeleteMailPiece = async (mailPieceId: string) => {
    try {
      setIsDeleting(mailPieceId);
      setDeleteError(null);
      
      await deleteMailPiece({ id: mailPieceId });
      
      // Refetch the data to update the list
      refetch();
    } catch (error) {
      console.error('Error deleting mail piece:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete mail piece');
    } finally {
      setIsDeleting(null);
    }
  };

  // Server-side sorting handler
  const handleSort = (field: string) => {
    setServerSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCurrentPage(1); // Reset to first page when sorting changes
  };


  // Page size handler
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const columns = createMailPieceColumns(handleSort);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Mail History"
            description="View your physical mail pieces"
            actions={
              <Button onClick={() => navigate('/mail/create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Mail Piece
              </Button>
            }
          />
          
          {/* Search and Filters - Skeleton state */}
          <div className="mb-6 space-y-4 opacity-50">
            <div className="relative">
              <div className="h-10 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="h-6 bg-muted rounded-full w-20 animate-pulse"></div>
              ))}
            </div>
          </div>

          {/* Content Area - Skeleton loading */}
          <div className="min-h-[400px]">
            <MailPieceSkeletonGrid count={3} />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Mail History"
            description="View your physical mail pieces"
          />
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load mail pieces. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Mail History"
          description="View your physical mail pieces"
          actions={
            <Button onClick={() => navigate('/mail/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Mail Piece
            </Button>
          }
        />

        {/* Error Display */}
        {deleteError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}


        {/* Mail Pieces Content Area - Smooth transition between states */}
        <div className="min-h-[400px] transition-all duration-300 ease-in-out">
          {mailPieces.length === 0 && !isLoading ? (
            <EmptyMailState onCreate={() => navigate('/mail/create')} />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={mailPieces as MailPieceWithRelations[]}
                enableViewToggle={true}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchable={true}
                searchPlaceholder="Search by recipient, description, or ID..."
                globalFilter={globalFilter}
                onGlobalFilterChange={setGlobalFilter}
                columnFilters={columnFilters}
                onColumnFiltersChange={setColumnFilters}
                cardRenderer={(row) => (
                  <MailPieceCard
                    row={row}
                    onDelete={handleDeleteMailPiece}
                    isDeleting={isDeleting === row.original.id}
                  />
                )}
                cardGridClassName="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
                onRowClick={(mailPiece) => navigate(`/mail/${mailPiece.id}`)}
              />

              {/* Server-Side Pagination Controls */}
              {mailData && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-100">
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Show:</span>
                    <div className="flex gap-1">
                      {[10, 20, 50].map((size) => (
                        <Button
                          key={size}
                          variant={pageSize === size ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handlePageSizeChange(size)}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                    <span className="text-muted-foreground">per page</span>
                  </div>

                  {/* Page info and navigation */}
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      Page {mailData.page} of {mailData.totalPages} ({mailData.total} total items)
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        disabled={!mailData.hasPrev}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!mailData.hasPrev}
                      >
                        Previous
                      </Button>
                      
                      {/* Page numbers */}
                      {(() => {
                        const pages: React.ReactNode[] = [];
                        const maxPages = 5;
                        let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
                        let endPage = Math.min(mailData.totalPages, startPage + maxPages - 1);
                        
                        if (endPage - startPage < maxPages - 1) {
                          startPage = Math.max(1, endPage - maxPages + 1);
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCurrentPage(i)}
                            >
                              {i}
                            </Button>
                          );
                        }
                        return pages;
                      })()}
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!mailData.hasNext}
                      >
                        Next
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(mailData.totalPages)}
                        disabled={!mailData.hasNext}
                      >
                        Last
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
