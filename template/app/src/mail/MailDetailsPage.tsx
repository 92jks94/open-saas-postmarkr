import React, { useState, useEffect } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getMailPiece, deleteMailPiece, getDownloadFileSignedURL, createMailCheckoutSession } from 'wasp/client/operations';
import type { MailPieceWithRelations } from './types';
import { 
  ArrowLeft, 
  AlertCircle, 
  Clock,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { MailPreview } from './components/MailPreview';
import { PDFViewer } from './components/PDFViewer';
import { OrderReceipt } from './components/OrderReceipt';
import { 
  generateOrderNumber, 
  formatDate,
  getStatusIcon
} from './utils';

/**
 * Detailed view component for individual mail pieces (Receipt-Focused Layout)
 * 
 * Features:
 * - Receipt-style order summary with all essential details
 * - Interactive PDF preview of uploaded document
 * - Lob-generated mail preview (when available)
 * - User-friendly order number generation
 * - Consolidated payment and status information
 * - Itemized cost breakdown
 * - Complete status timeline
 * - Streamlined actions menu
 * 
 * Layout:
 * - Desktop: 50/50 split - PDF viewer left, receipt right
 * - Mobile: Single column stacked layout
 * - Print-optimized receipt display
 */
export default function MailDetailsPage() {
  const { data: user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: mailPiece, isLoading, error, refetch } = useQuery(getMailPiece, { id: id! }) as {
    data: MailPieceWithRelations | undefined;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };

  // Manual refresh only - no auto-refresh for simplified testing

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const handleDeleteMailPiece = async () => {
    if (!mailPiece) return;
    
    if (!confirm('Are you sure you want to delete this mail piece? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      setActionError(null);
      
      await deleteMailPiece({ id: mailPiece.id });
      
      // Navigate back to history after successful deletion
      navigate('/mail/history');
    } catch (error) {
      console.error('Error deleting mail piece:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to delete mail piece');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadFile = async () => {
    if (!mailPiece?.file) return;

    try {
      setIsDownloading(true);
      setActionError(null);
      
      const result = await getDownloadFileSignedURL({ key: mailPiece.file.key });
      
      if (result) {
        window.open(result, '_blank');
      } else {
        throw new Error('Failed to get download URL');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      setActionError(error instanceof Error ? error.message : 'Failed to download file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleEditMailPiece = () => {
    if (!mailPiece) return;
    
    // Redirect to mail creation page with edit mode
    navigate(`/mail/create?edit=${mailPiece.id}`);
  };

  const handleViewInLobDashboard = () => {
    if (!mailPiece?.lobId) return;
    
    // Open Lob dashboard in new tab (this would be the actual Lob dashboard URL)
    const lobDashboardUrl = `https://dashboard.lob.com/mail/${mailPiece.lobId}`;
    window.open(lobDashboardUrl, '_blank');
  };

  const handlePayNow = async () => {
    if (!mailPiece) return;
    
    try {
      setIsProcessingPayment(true);
      setActionError(null);
      
      // Create Stripe Checkout Session
      const checkoutData = await createMailCheckoutSession({
        mailPieceId: mailPiece.id
      });
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutData.sessionUrl;
    } catch (error: any) {
      console.error('Payment error:', error);
      setActionError(error.message || 'Failed to start payment process. Please try again.');
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !mailPiece) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load mail piece details. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const orderNumber = generateOrderNumber(mailPiece.paymentIntentId, mailPiece.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/mail/history')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to History
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Order #{orderNumber}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {mailPiece.description || 'Mail Piece Details'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {formatDate(mailPiece.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {mailPiece.status === 'draft' && (
                    <DropdownMenuItem onClick={handleEditMailPiece}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Draft
                    </DropdownMenuItem>
                  )}
                  {mailPiece.file && (
                    <DropdownMenuItem 
                      onClick={handleDownloadFile}
                      disabled={isDownloading}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isDownloading ? 'Downloading...' : 'Download PDF'}
                    </DropdownMenuItem>
                  )}
                  {mailPiece.lobId && (
                    <DropdownMenuItem onClick={handleViewInLobDashboard}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View in Lob Dashboard
                    </DropdownMenuItem>
                  )}
                  {mailPiece.status === 'draft' && (
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={handleDeleteMailPiece}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Deleting...' : 'Delete Draft'}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Error Display */}
          {actionError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}
        </div>

        {/* Main Content - Receipt-Focused Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: PDF Preview */}
          <div className="space-y-6">
            {/* PDF Viewer for uploaded file */}
            {mailPiece.file?.key ? (
              <PDFViewer 
                fileKey={mailPiece.file.key}
                className="sticky top-8"
              />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center h-96 p-8">
                  <FileText className="h-16 w-16 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    No PDF file attached to this mail piece
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Lob Preview (show when available) */}
            <MailPreview 
              thumbnails={mailPiece.lobThumbnails as any}
              lobPreviewUrl={mailPiece.lobPreviewUrl}
              mailType={mailPiece.mailType}
              lobId={mailPiece.lobId}
            />
          </div>

          {/* Right Column: Order Receipt */}
          <div className="space-y-6">
            <OrderReceipt 
              mailPiece={mailPiece}
              onPayNow={mailPiece.status === 'pending_payment' ? handlePayNow : undefined}
              isProcessingPayment={isProcessingPayment}
            />

            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-base">
                  <Clock className="h-5 w-5 mr-2" />
                  Status Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mailPiece.statusHistory && mailPiece.statusHistory.length > 0 ? (
                    <div className="space-y-3">
                      {mailPiece.statusHistory.map((history, index) => (
                        <div key={index} className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(history.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">
                              {history.status.replace('_', ' ').toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {history.description}
                            </p>
                            <p className="text-xs text-gray-400">
                              {formatDate(history.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No status history available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

