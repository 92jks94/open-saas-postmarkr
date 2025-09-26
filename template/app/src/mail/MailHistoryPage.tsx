import React, { useState } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useQuery } from 'wasp/client/operations';
import { getMailPieces, deleteMailPiece, updateMailPiece } from 'wasp/client/operations';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Eye, 
  Trash2, 
  MoreHorizontal,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  Mail
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Alert, AlertDescription } from '../components/ui/alert';

/**
 * Simplified mail history page for testing
 * 
 * Features:
 * - Basic mail piece listing
 * - Simple status display
 * - Navigation to individual mail piece details
 */
export default function MailHistoryPage() {
  const { data: user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const { data: mailData, isLoading, error } = useQuery(getMailPieces, {
    page: 1,
    limit: 50,
    status: 'all',
    mailType: 'all',
    search: ''
  });

  const mailPieces = mailData?.mailPieces || [];

  // Simple sorting by creation date (newest first)
  const sortedMailPieces = [...mailPieces].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
      case 'returned':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'in_transit':
      case 'processing':
        return <Package className="h-4 w-4 text-blue-500" />;
      case 'draft':
      case 'pending_payment':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'default';
      case 'failed':
      case 'returned':
        return 'destructive';
      case 'in_transit':
      case 'processing':
        return 'secondary';
      case 'draft':
      case 'pending_payment':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleDeleteMailPiece = async (mailPieceId: string) => {
    if (!confirm('Are you sure you want to delete this mail piece? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(mailPieceId);
      setDeleteError(null);
      
      await deleteMailPiece({ id: mailPieceId });
      
      // Refetch the data to update the list
      window.location.reload(); // Simple refresh for now
    } catch (error) {
      console.error('Error deleting mail piece:', error);
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete mail piece');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleEditMailPiece = (mailPieceId: string) => {
    // For now, redirect to mail creation page with the mail piece ID
    // In a full implementation, this would open an edit modal or redirect to edit page
    navigate(`/mail/create?edit=${mailPieceId}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-24 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mail History
              </h1>
              <p className="text-gray-600 mt-2">
                View your physical mail pieces
              </p>
            </div>
            <Button onClick={() => navigate('/mail/create')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Mail Piece
            </Button>
          </div>
        </div>


        {/* Error Display */}
        {deleteError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}

        {/* Mail Pieces List */}
        <div className="space-y-4">
          {sortedMailPieces.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No mail pieces found
                </h3>
                <p className="text-gray-500 mb-4">
                  Create your first mail piece to get started.
                </p>
                <Button onClick={() => navigate('/mail/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Mail Piece
                </Button>
              </CardContent>
            </Card>
          ) : (
            sortedMailPieces.map((mailPiece) => (
              <Card key={mailPiece.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(mailPiece.status)}
                          <h3 className="text-lg font-medium text-gray-900">
                            {mailPiece.description || 'Untitled Mail Piece'}
                          </h3>
                          <Badge variant={getStatusBadgeVariant(mailPiece.status)}>
                            {mailPiece.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Type:</span> {mailPiece.mailType}
                        </div>
                        <div>
                          <span className="font-medium">Class:</span> {mailPiece.mailClass}
                        </div>
                        <div>
                          <span className="font-medium">Size:</span> {mailPiece.mailSize}
                        </div>
                        <div>
                          <span className="font-medium">From:</span> {mailPiece.senderAddress?.contactName}
                        </div>
                        <div>
                          <span className="font-medium">To:</span> {mailPiece.recipientAddress?.contactName}
                        </div>
                        <div>
                          <span className="font-medium">Cost:</span> {formatCurrency(mailPiece.cost)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Created: {formatDate(mailPiece.createdAt.toISOString())}
                        </div>
                        {mailPiece.lobTrackingNumber && (
                          <div className="flex items-center">
                            <Package className="h-3 w-3 mr-1" />
                            Tracking: {mailPiece.lobTrackingNumber}
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/mail/${mailPiece.id}`)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/mail/${mailPiece.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {mailPiece.status === 'draft' && (
                            <DropdownMenuItem onClick={() => handleEditMailPiece(mailPiece.id)}>
                              <Package className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}
                          {mailPiece.status === 'draft' && (
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteMailPiece(mailPiece.id)}
                              disabled={isDeleting === mailPiece.id}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isDeleting === mailPiece.id ? 'Deleting...' : 'Delete'}
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Results Summary */}
        {sortedMailPieces.length > 0 && (
          <div className="mt-4 text-center text-sm text-gray-500">
            {sortedMailPieces.length} mail piece{sortedMailPieces.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
};

