import React, { useState, useEffect } from 'react';
import { useAuth } from 'wasp/client/auth';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'wasp/client/operations';
import { getMailPiece } from 'wasp/client/operations';
import type { MailPieceWithRelations } from './types';
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Package, 
  Mail, 
  Clock,
  Calendar,
  MapPin,
  User,
  FileText,
  CreditCard,
  RefreshCw,
  Download,
  Edit,
  Trash2,
  MoreHorizontal,
  ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Alert, AlertDescription } from '../components/ui/alert';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Separator } from '../components/ui/separator';

/**
 * Detailed view component for individual mail pieces
 * 
 * Displays comprehensive mail piece information including:
 * - Status tracking with visual indicators and progress
 * - Address information (sender/recipient) with validation status
 * - File attachments and previews
 * - Payment details and history
 * - Action buttons (edit, delete, refresh, submit to Lob)
 * - Real-time status updates and error handling
 */
export default function MailDetailsPage() {
  const { data: user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
      case 'returned':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'in_transit':
      case 'processing':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'draft':
      case 'pending_payment':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Mail className="h-5 w-5 text-gray-500" />;
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

  const getStatusProgress = (status: string) => {
    const statusProgress = {
      'draft': 10,
      'pending_payment': 20,
      'paid': 30,
      'submitted': 40,
      'processing': 60,
      'in_transit': 80,
      'delivered': 100,
      'failed': 0,
      'returned': 0
    };
    return statusProgress[status as keyof typeof statusProgress] || 0;
  };

  const getStatusDescription = (status: string) => {
    const descriptions = {
      'draft': 'Mail piece is in draft status and ready for payment',
      'pending_payment': 'Payment is required before processing can begin',
      'paid': 'Payment confirmed, preparing for submission',
      'submitted': 'Submitted to Lob for processing',
      'processing': 'Lob is processing your mail piece',
      'in_transit': 'Your mail piece is in transit to the destination',
      'delivered': 'Mail piece has been successfully delivered',
      'failed': 'Processing failed - please contact support',
      'returned': 'Mail piece was returned to sender'
    };
    return descriptions[status as keyof typeof descriptions] || 'Unknown status';
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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
                <h1 className="text-3xl font-bold text-gray-900">
                  {mailPiece.description || 'Mail Piece Details'}
                </h1>
                <p className="text-gray-600 mt-1">
                  Created on {formatDate(mailPiece.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
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
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {mailPiece.file && (
                    <DropdownMenuItem>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </DropdownMenuItem>
                  )}
                  {mailPiece.lobId && (
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View in Lob Dashboard
                    </DropdownMenuItem>
                  )}
                  {mailPiece.status === 'draft' && (
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Simplified Implementation Notice */}
          <Alert className="mb-6">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Simplified Mode:</strong> Basic mail tracking and status display for testing.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  {getStatusIcon(mailPiece.status)}
                  <span className="ml-2">Status Overview</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant={getStatusBadgeVariant(mailPiece.status)} className="text-sm">
                      {mailPiece.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {getStatusDescription(mailPiece.status)}
                  </p>
                  
                  {mailPiece.lobTrackingNumber && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <Package className="h-4 w-4 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-blue-900">
                          Tracking Number: {mailPiece.lobTrackingNumber}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mail Specifications */}
            <Card>
              <CardHeader>
                <CardTitle>Mail Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mail Type</label>
                    <p className="text-sm text-gray-900 capitalize">{mailPiece.mailType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mail Class</label>
                    <p className="text-sm text-gray-900 capitalize">{mailPiece.mailClass}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Size</label>
                    <p className="text-sm text-gray-900">{mailPiece.mailSize}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Cost</label>
                    <p className="text-sm text-gray-900">{formatCurrency(mailPiece.cost)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Sender Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Sender Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mailPiece.senderAddress ? (
                    <div className="space-y-2">
                      <p className="font-medium">{mailPiece.senderAddress.contactName}</p>
                      <p className="text-sm text-gray-600">{mailPiece.senderAddress.address_line1}</p>
                      {mailPiece.senderAddress.address_line2 && (
                        <p className="text-sm text-gray-600">{mailPiece.senderAddress.address_line2}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {mailPiece.senderAddress.address_city}, {mailPiece.senderAddress.address_state} {mailPiece.senderAddress.address_zip}
                      </p>
                      <p className="text-sm text-gray-600">{mailPiece.senderAddress.address_country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No sender address</p>
                  )}
                </CardContent>
              </Card>

              {/* Recipient Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Recipient Address
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {mailPiece.recipientAddress ? (
                    <div className="space-y-2">
                      <p className="font-medium">{mailPiece.recipientAddress.contactName}</p>
                      <p className="text-sm text-gray-600">{mailPiece.recipientAddress.address_line1}</p>
                      {mailPiece.recipientAddress.address_line2 && (
                        <p className="text-sm text-gray-600">{mailPiece.recipientAddress.address_line2}</p>
                      )}
                      <p className="text-sm text-gray-600">
                        {mailPiece.recipientAddress.address_city}, {mailPiece.recipientAddress.address_state} {mailPiece.recipientAddress.address_zip}
                      </p>
                      <p className="text-sm text-gray-600">{mailPiece.recipientAddress.address_country}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No recipient address</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* File Information */}
            {mailPiece.file && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    File Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{mailPiece.file.name}</p>
                    <p className="text-sm text-gray-600">
                      Size: {mailPiece.file.size ? (mailPiece.file.size / 1024 / 1024).toFixed(2) : 'Unknown'} MB
                    </p>
                    <p className="text-sm text-gray-600">
                      Type: {mailPiece.file.type}
                    </p>
                    <p className="text-sm text-gray-600">
                      Uploaded: {formatDate(mailPiece.file.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <Badge variant={mailPiece.paymentStatus === 'paid' ? 'default' : 'outline'}>
                      {mailPiece.paymentStatus.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Amount</span>
                    <span className="text-sm font-medium">{formatCurrency(mailPiece.cost)}</span>
                  </div>
                  {mailPiece.paymentIntentId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Payment ID</span>
                      <span className="text-xs text-gray-400 font-mono">
                        {mailPiece.paymentIntentId.slice(-8)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
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

            {/* Lob Integration */}
            {mailPiece.lobId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Lob Integration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Lob ID</span>
                      <span className="text-xs text-gray-400 font-mono">
                        {mailPiece.lobId.slice(-8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Lob Status</span>
                      <Badge variant="outline">
                        {mailPiece.lobStatus || 'Unknown'}
                      </Badge>
                    </div>
                    {mailPiece.lobTrackingNumber && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Tracking</span>
                        <span className="text-xs text-gray-400 font-mono">
                          {mailPiece.lobTrackingNumber}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

