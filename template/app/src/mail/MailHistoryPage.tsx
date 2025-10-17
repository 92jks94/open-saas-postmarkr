import React, { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getMailPieces, deleteMailPiece /* createBulkMailCheckoutSession */ } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { ColumnFiltersState, RowSelectionState } from '@tanstack/react-table';
import { AlertCircle /* CreditCard */ } from 'lucide-react';
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
import { getButtonTextClasses } from '../components/ui/selection-utils';

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
  // Row selection state (kept for potential future use)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  // Bulk payment functionality commented out - cards now navigate to detail page
  // const [isProcessingBulkPayment, setIsProcessingBulkPayment] = useState(false);
  
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

  // Bulk payment handler commented out - cards now navigate to detail page
  // const handleBulkPayment = async () => {
  //   const selectedMailPieceIds = Object.keys(rowSelection).filter(key => rowSelection[key]);
  //   
  //   if (selectedMailPieceIds.length === 0) {
  //     alert('Please select mail pieces to pay for');
  //     return;
  //   }

  //   // Filter to only include mail pieces that are in draft or pending_payment status
  //   const payableMailPieces = mailPieces.filter(piece => 
  //     selectedMailPieceIds.includes(piece.id) && 
  //     (piece.status === 'draft' || piece.status === 'pending_payment')
  //   );

  //   if (payableMailPieces.length === 0) {
  //     alert('Selected mail pieces are not eligible for payment');
  //     return;
  //   }

  //   if (payableMailPieces.length !== selectedMailPieceIds.length) {
  //     const nonPayableCount = selectedMailPieceIds.length - payableMailPieces.length;
  //     if (!confirm(`${nonPayableCount} selected mail pieces are not eligible for payment. Continue with ${payableMailPieces.length} eligible pieces?`)) {
  //       return;
  //     }
  //   }

  //   try {
  //     setIsProcessingBulkPayment(true);
  //     
  //     const checkoutData = await createBulkMailCheckoutSession({
  //       mailPieceIds: payableMailPieces.map(piece => piece.id)
  //     });
  //     
  //     // Redirect to Stripe Checkout
  //     window.location.href = checkoutData.sessionUrl;
  //   } catch (error: any) {
  //     console.error('Bulk payment error:', error);
  //     alert(error.message || 'Failed to start bulk payment process. Please try again.');
  //   } finally {
  //     setIsProcessingBulkPayment(false);
  //   }
  // };

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

  const handleCardClick = (rowId: string) => {
    // Navigate to detail page instead of toggling selection
    navigate(`/mail/${rowId}`);
  };

  // Selected count calculation (kept for potential future use)
  // const selectedCount = getSelectedCount(rowSelection);
  const columns = createMailPieceColumns(handleSort);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Mail History"
            description="View your physical mail pieces"
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
            // Pay Selected functionality commented out - cards now navigate to detail page
            // {hasSelectedRows(rowSelection) ? (
            //   <Button 
            //     onClick={handleBulkPayment}
            //     disabled={isProcessingBulkPayment}
            //     variant="default"
            //   >
            //     <CreditCard className="h-4 w-4 mr-2" />
            //     {isProcessingBulkPayment ? 'Processing...' : `Pay Selected (${selectedCount})`}
            //   </Button>
            // ) : undefined}
            undefined
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
                enableRowSelection={false}
                rowSelection={{}}
                onRowSelectionChange={() => {}}
                cardRenderer={(row) => (
                  <MailPieceCard
                    row={row}
                    onDelete={handleDeleteMailPiece}
                    isDeleting={isDeleting === row.original.id}
                    onCardClick={() => handleCardClick(row.original.id)}
                  />
                )}
                cardGridClassName="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3 animate-in fade-in-0 slide-in-from-bottom-4 duration-300"
                onRowClick={(mailPiece) => navigate(`/mail/${mailPiece.id}`)}
              />

              {/* Server-Side Pagination Controls */}
              {mailData && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300 delay-100">
                  {/* Items per page selector - simplified */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Show:</span>
                    <div className="flex gap-0.5">
                      {[10, 20, 50].map((size) => (
                        <Button
                          key={size}
                          variant={pageSize === size ? 'secondary' : 'ghost'}
                          size="sm"
                          onClick={() => handlePageSizeChange(size)}
                          className={`text-xs px-2 py-1 h-6 ${getButtonTextClasses(pageSize === size)}`}
                        >
                          {size}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Page info and navigation - simplified */}
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-muted-foreground">
                      {mailData.page} / {mailData.totalPages} ({mailData.total})
                    </div>
                    
                    <div className="flex items-center gap-0.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={!mailData.hasPrev}
                        className={`text-xs px-2 py-1 h-6 ${getButtonTextClasses(false)}`}
                      >
                        Prev
                      </Button>
                      
                      {/* Page numbers - simplified to show only current and adjacent pages */}
                      {(() => {
                        const pages: React.ReactNode[] = [];
                        const maxPages = 3;
                        let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
                        let endPage = Math.min(mailData.totalPages, startPage + maxPages - 1);
                        
                        if (endPage - startPage < maxPages - 1) {
                          startPage = Math.max(1, endPage - maxPages + 1);
                        }
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => setCurrentPage(i)}
                              className={`text-xs px-2 py-1 h-6 ${getButtonTextClasses(currentPage === i)}`}
                            >
                              {i}
                            </Button>
                          );
                        }
                        return pages;
                      })()}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={!mailData.hasNext}
                        className={`text-xs px-2 py-1 h-6 ${getButtonTextClasses(false)}`}
                      >
                        Next
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
