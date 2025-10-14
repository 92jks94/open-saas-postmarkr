import React, { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getMailPieces, deleteMailPiece } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { Plus, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Alert, AlertDescription } from '../components/ui/alert';
import { PageLoadingSpinner } from '../components/ui/loading-spinner';
import { EmptyMailState } from '../components/ui/empty-state';
import { PageHeader } from '../components/ui/page-header';
import { DataTable } from '../components/ui/data-table';
import { ViewMode } from '../components/ui/view-mode-toggle';
import { createMailPieceColumns, MailPieceWithRelations } from './columns';
import { MailPieceCard } from './components/MailPieceCard';

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
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [serverSort, setServerSort] = useState<{
    field?: string;
    direction?: 'asc' | 'desc';
  }>({ field: 'createdAt', direction: 'desc' }); // Default: newest first

  const { data: mailData, isLoading, error, refetch } = useQuery(getMailPieces, {
    page: currentPage,
    limit: pageSize,
    status: 'all',
    mailType: 'all',
    search: searchQuery,
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

  const columns = createMailPieceColumns(handleSort);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader
            title="Mail History"
            description="View your physical mail pieces"
          />
          <PageLoadingSpinner text="Loading mail pieces..." />
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

        {/* Mail Pieces DataTable with Card/Table Toggle */}
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
              searchable={false} // We'll handle search separately for server-side
              cardRenderer={(row) => (
                <MailPieceCard
                  row={row}
                  onDelete={handleDeleteMailPiece}
                  isDeleting={isDeleting === row.original.id}
                />
              )}
              cardGridClassName="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"
              onRowClick={(mailPiece) => navigate(`/mail/${mailPiece.id}`)}
            />

            {/* Server-Side Pagination Controls */}
            {mailData && mailData.totalPages > 1 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="text-sm text-muted-foreground">
                  Page {mailData.page} of {mailData.totalPages} ({mailData.total} total items)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={!mailData.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={!mailData.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
