import React, { useState, useEffect } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getMailPiece, deleteMailPiece, getDownloadFileSignedURL, createMailCheckoutSession, getReceiptDownloadUrl, sendReceiptEmail } from 'wasp/client/operations';
import type { MailPieceWithRelations } from './types';
import { 
  ArrowLeft, 
  AlertCircle, 
  Clock,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  CreditCard,
  Printer,
  Mail,
  Loader2
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
import { StatusTimeline } from './components/StatusTimeline';
import { 
  generateOrderNumber, 
  formatDate,
  getStatusIcon,
  isDraftReadyForPayment
} from './utils';
import { toast } from 'react-hot-toast';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isDownloadingReceipt, setIsDownloadingReceipt] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const { data: mailPiece, isLoading, error, refetch } = useQuery(getMailPiece, { id: id! }) as {
    data: MailPieceWithRelations | undefined;
    isLoading: boolean;
    error: any;
    refetch: () => void;
  };

  // Manual refresh only - no auto-refresh for simplified testing

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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadReceipt = async () => {
    if (!mailPiece || isDownloadingReceipt) return;
    
    try {
      setIsDownloadingReceipt(true);
      toast.loading('Generating receipt...', { id: 'download-receipt' });
      
      const result = await getReceiptDownloadUrl({ mailPieceId: mailPiece.id });
      
      // Open download URL in new tab
      window.open(result.downloadUrl, '_blank');
      
      toast.success('Receipt downloaded successfully!', { id: 'download-receipt' });
    } catch (error) {
      console.error('Failed to download receipt:', error);
      toast.error('Failed to download receipt. Please try again.', { id: 'download-receipt' });
    } finally {
      setIsDownloadingReceipt(false);
    }
  };

  const handleSendReceiptEmail = async () => {
    if (!mailPiece || isSendingEmail) return;
    
    try {
      setIsSendingEmail(true);
      toast.loading('Sending receipt email...', { id: 'send-email' });
      
      await sendReceiptEmail({ mailPieceId: mailPiece.id });
      
      toast.success('Receipt email sent successfully!', { id: 'send-email' });
    } catch (error) {
      console.error('Failed to send receipt email:', error);
      toast.error('Failed to send receipt email. Please try again.', { id: 'send-email' });
    } finally {
      setIsSendingEmail(false);
    }
  };


  // Debug logging for draft payment readiness
  const debugDraftReadiness = (mailPiece: MailPieceWithRelations) => {
    const isReady = isDraftReadyForPayment(mailPiece);
    console.log('🔍 Draft payment readiness check:', {
      mailType: mailPiece.mailType,
      mailClass: mailPiece.mailClass,
      mailSize: mailPiece.mailSize,
      senderAddressId: mailPiece.senderAddressId,
      recipientAddressId: mailPiece.recipientAddressId,
      fileId: mailPiece.fileId,
      isReady
    });
    return isReady;
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

  // Debug logging
  console.log('🔍 MailDetailsPage - mailPiece data:', {
    id: mailPiece.id,
    status: mailPiece.status,
    paymentStatus: mailPiece.paymentStatus,
    mailType: mailPiece.mailType,
    mailClass: mailPiece.mailClass,
    mailSize: mailPiece.mailSize,
    senderAddressId: mailPiece.senderAddressId,
    recipientAddressId: mailPiece.recipientAddressId,
    fileId: mailPiece.fileId,
    lobId: mailPiece.lobId,
    hasFile: !!mailPiece.file,
    fileKey: mailPiece.file?.key
  });

  // Debug menu conditions
  console.log('🔍 Menu conditions check:', {
    isDraft: mailPiece.status === 'draft',
    isDraftReadyForPayment: mailPiece.status === 'draft' ? debugDraftReadiness(mailPiece) : false,
    hasFile: !!mailPiece.file,
    hasLobId: !!mailPiece.lobId,
    showEditDraft: mailPiece.status === 'draft',
    showPayNow: mailPiece.status === 'draft' && debugDraftReadiness(mailPiece),
    showDownloadFile: !!mailPiece.file,
    showDelete: mailPiece.status === 'draft' || (!mailPiece.file && !mailPiece.lobId)
  });

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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {/* Draft Actions */}
                  {mailPiece.status === 'draft' && (
                    <DropdownMenuItem onClick={handleEditMailPiece}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Draft
                    </DropdownMenuItem>
                  )}
                  {mailPiece.status === 'draft' && debugDraftReadiness(mailPiece) && (
                    <DropdownMenuItem 
                      onClick={handlePayNow}
                      disabled={isProcessingPayment}
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      {isProcessingPayment ? 'Processing...' : 'Pay Now'}
                    </DropdownMenuItem>
                  )}
                  {mailPiece.file && (
                    <DropdownMenuItem 
                      onClick={handleDownloadFile}
                      disabled={isDownloading}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      {isDownloading ? 'Downloading...' : 'Download PDF'}
                    </DropdownMenuItem>
                  )}
                  
                  {/* Receipt Actions - Only show for paid orders */}
                  {mailPiece.paymentStatus === 'paid' && (
                    <>
                      {/* Print Receipt - Commented out per request */}
                      {/* <DropdownMenuItem onClick={handlePrint}>
                        <Printer className="h-4 w-4 mr-2" />
                        Print Receipt
                      </DropdownMenuItem> */}
                      <DropdownMenuItem 
                        onClick={handleDownloadReceipt}
                        disabled={isDownloadingReceipt}
                      >
                        {isDownloadingReceipt ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 mr-2" />
                        )}
                        {isDownloadingReceipt ? 'Generating...' : 'Download Receipt PDF'}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={handleSendReceiptEmail}
                        disabled={isSendingEmail}
                      >
                        {isSendingEmail ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Mail className="h-4 w-4 mr-2" />
                        )}
                        {isSendingEmail ? 'Sending...' : 'Email Receipt'}
                      </DropdownMenuItem>
                    </>
                  )}
                  
                  {/* Always show cancel option for drafts, or if no other actions are available */}
                  {(mailPiece.status === 'draft' || (!mailPiece.file && !mailPiece.lobId)) && (
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={handleDeleteMailPiece}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {isDeleting ? 'Canceling...' : mailPiece.status === 'draft' ? 'Cancel Draft' : 'Cancel Mail Piece'}
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
              onEditDraft={mailPiece.status === 'draft' ? handleEditMailPiece : undefined}
              isProcessingPayment={isProcessingPayment}
            />

            {/* Status Timeline */}
            <StatusTimeline mailPiece={mailPiece} />
          </div>
        </div>
      </div>
    </div>
  );
};

