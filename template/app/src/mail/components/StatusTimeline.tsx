import React, { useState, useMemo, useCallback } from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp,
  FileText,
  CreditCard,
  Printer,
  Mail,
  Truck,
  Home,
  RotateCcw,
  Ban
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { formatDate } from '../utils';
import type { MailPieceWithRelations } from '../types';

interface StatusTimelineProps {
  mailPiece: MailPieceWithRelations;
}

interface TimelineItem {
  id: string;
  label: string;
  status: 'completed' | 'pending' | 'not_started';
  icon: React.ReactNode;
  date?: Date;
  description?: string;
}

// Status progression configuration - single source of truth
const STATUS_PROGRESSION = {
  // Main timeline statuses (always visible)
  MAIN: [
    'draft',
    'paid', 
    'submitted',
    'printed',
    'mailed',
    'in_transit',
    'final'
  ],
  // Detailed timeline statuses (expandable)
  DETAILED: [
    'draft',
    'file_uploaded',
    'addresses_configured', 
    'specifications_configured',
    'changes_made',
    'payment_started',
    'paid',
    'payment_failed',
    'payment_refunded',
    'submitted',
    'processing',
    'printed',
    'mailed',
    'rerouted',
    'in_transit',
    'delivered',
    'returned',
    'failed',
    'cancelled'
  ]
} as const;

// Status groups for efficient checking
const STATUS_GROUPS = {
  PROCESSING: ['submitted', 'processing', 'printed', 'mailed', 'in_transit', 'delivered', 'returned', 'failed'],
  PRINTED: ['printed', 'mailed', 'in_transit', 'delivered', 'returned', 'failed'],
  MAILED: ['mailed', 'in_transit', 'delivered', 'returned', 'failed'],
  IN_TRANSIT: ['in_transit', 'delivered', 'returned', 'failed'],
  FINAL: ['delivered', 'returned', 'failed', 'cancelled']
} as const;

// Icon mapping - single source of truth
const STATUS_ICONS = {
  draft: <FileText className="h-4 w-4" />,
  file_uploaded: <FileText className="h-4 w-4" />,
  addresses_configured: <Mail className="h-4 w-4" />,
  specifications_configured: <Printer className="h-4 w-4" />,
  changes_made: <FileText className="h-4 w-4" />,
  payment_started: <CreditCard className="h-4 w-4" />,
  paid: <CreditCard className="h-4 w-4" />,
  payment_failed: <AlertCircle className="h-4 w-4" />,
  payment_refunded: <RotateCcw className="h-4 w-4" />,
  submitted: <Printer className="h-4 w-4" />,
  processing: <Printer className="h-4 w-4" />,
  printed: <Printer className="h-4 w-4" />,
  mailed: <Mail className="h-4 w-4" />,
  rerouted: <Truck className="h-4 w-4" />,
  in_transit: <Truck className="h-4 w-4" />,
  delivered: <Home className="h-4 w-4" />,
  returned: <RotateCcw className="h-4 w-4" />,
  failed: <AlertCircle className="h-4 w-4" />,
  cancelled: <Ban className="h-4 w-4" />
} as const;

// Label mapping - single source of truth
const STATUS_LABELS = {
  draft: 'Mail piece draft created',
  file_uploaded: 'Document uploaded for mailing',
  addresses_configured: 'Sender and recipient addresses configured',
  specifications_configured: 'Mail specifications configured',
  changes_made: 'Changed/edited: pdf, sender, recipient',
  payment_started: 'Payment process started',
  paid: 'Payment completed successfully',
  payment_failed: 'Payment failed - retry required',
  payment_refunded: 'Payment refunded',
  submitted: 'Mail piece submitted for processing',
  processing: 'Processing your mail',
  printed: 'Mail piece has been printed',
  mailed: 'Mail piece has been mailed',
  rerouted: 'Mail piece has been re-routed',
  in_transit: 'Mail piece at destination facility',
  delivered: 'Mail piece delivered',
  returned: 'Mail piece returned to sender',
  failed: 'Delivery failed',
  cancelled: 'Cancelled',
  final: 'Mail piece delivered' // Will be dynamically updated
} as const;

/**
 * StatusTimeline component displays the mail piece status progression
 * 
 * Features:
 * - Always shows main timeline items with current status
 * - Expandable "View Details" section with comprehensive status history
 * - Smart status determination for final delivery status
 * - Visual indicators for completed, pending, and not-started items
 * - Optimized with memoization and DRY principles
 */
export function StatusTimeline({ mailPiece }: StatusTimelineProps) {
  const [showDetails, setShowDetails] = useState(false);

  // Memoized status history lookup - prevents repeated searches
  const statusHistoryMap = useMemo(() => {
    const map = new Map<string, typeof mailPiece.statusHistory[0]>();
    // Map by status only - first occurrence wins
    mailPiece.statusHistory?.forEach(entry => {
      if (!map.has(entry.status)) {
        map.set(entry.status, entry);
      }
    });
    return map;
  }, [mailPiece.statusHistory]);

  // Memoized final status determination
  const finalStatus = useMemo((): 'delivered' | 'returned' | 'failed' | 'cancelled' => {
    if (mailPiece.status === 'cancelled') return 'cancelled';
    if (mailPiece.status === 'failed') return 'failed';
    if (mailPiece.status === 'returned') return 'returned';
    if (mailPiece.status === 'delivered') return 'delivered';
    return 'delivered'; // Default
  }, [mailPiece.status]);

  // Helper function to determine if a status group is completed
  const isStatusGroupCompleted = (statusGroup: readonly string[]): boolean => {
    return statusGroup.includes(mailPiece.status);
  };

  // Helper function to get status history entry
  const getStatusHistoryEntry = (status: string) => {
    return statusHistoryMap.get(status);
  };

  // Helper function to create timeline item
  const createTimelineItem = (
    id: string,
    label: string,
    statusCheck: () => boolean,
    icon: React.ReactNode,
    date?: Date,
    description?: string
  ): TimelineItem => ({
    id,
    label,
    status: statusCheck() ? 'completed' : 'not_started',
    icon,
    date,
    description
  });

  // Memoized main timeline items
  const mainTimelineItems = useMemo((): TimelineItem[] => [
    createTimelineItem(
      'draft_created',
      STATUS_LABELS.draft,
      () => true, // Always completed if mail piece exists
      STATUS_ICONS.draft,
      mailPiece.createdAt,
      'Draft created'
    ),
    createTimelineItem(
      'payment_completed',
      STATUS_LABELS.paid,
      () => mailPiece.paymentStatus === 'paid',
      STATUS_ICONS.paid,
      getStatusHistoryEntry('paid')?.createdAt,
      'Payment processed'
    ),
    createTimelineItem(
      'processing',
      STATUS_LABELS.processing,
      () => isStatusGroupCompleted(STATUS_GROUPS.PROCESSING),
      STATUS_ICONS.processing,
      getStatusHistoryEntry('submitted')?.createdAt,
      'Mail processing started'
    ),
    createTimelineItem(
      'printed',
      STATUS_LABELS.printed,
      () => isStatusGroupCompleted(STATUS_GROUPS.PRINTED),
      STATUS_ICONS.printed,
      getStatusHistoryEntry('printed')?.createdAt,
      'Printing completed'
    ),
    createTimelineItem(
      'mailed',
      STATUS_LABELS.mailed,
      () => isStatusGroupCompleted(STATUS_GROUPS.MAILED),
      STATUS_ICONS.mailed,
      getStatusHistoryEntry('mailed')?.createdAt,
      'Mail dispatched'
    ),
    createTimelineItem(
      'destination',
      STATUS_LABELS.in_transit,
      () => isStatusGroupCompleted(STATUS_GROUPS.IN_TRANSIT),
      STATUS_ICONS.in_transit,
      getStatusHistoryEntry('in_transit')?.createdAt,
      'At destination facility'
    ),
    createTimelineItem(
      'final_status',
      `Mail piece ${finalStatus}`,
      () => isStatusGroupCompleted(STATUS_GROUPS.FINAL),
      STATUS_ICONS[finalStatus],
      getStatusHistoryEntry(finalStatus)?.createdAt,
      `Status: ${finalStatus}`
    )
  ], [mailPiece, statusHistoryMap, finalStatus]);

  // Memoized detailed timeline items
  const detailedTimelineItems = useMemo((): TimelineItem[] => [
    createTimelineItem(
      'draft_created_detail',
      STATUS_LABELS.draft,
      () => true,
      STATUS_ICONS.draft,
      mailPiece.createdAt,
      'Draft created'
    ),
    createTimelineItem(
      'document_uploaded',
      STATUS_LABELS.file_uploaded,
      () => !!mailPiece.file,
      STATUS_ICONS.file_uploaded,
      mailPiece.file?.createdAt,
      'Document attached'
    ),
    createTimelineItem(
      'addresses_configured',
      STATUS_LABELS.addresses_configured,
      () => !!(mailPiece.senderAddress && mailPiece.recipientAddress),
      STATUS_ICONS.addresses_configured,
      mailPiece.createdAt,
      'Addresses set up'
    ),
    createTimelineItem(
      'specifications_configured',
      STATUS_LABELS.specifications_configured,
      () => !!(mailPiece.mailType && mailPiece.mailClass && mailPiece.mailSize),
      STATUS_ICONS.specifications_configured,
      mailPiece.createdAt,
      'Specifications set'
    ),
    createTimelineItem(
      'changes_made',
      STATUS_LABELS.changes_made,
      () => !!getStatusHistoryEntry('draft')?.description?.includes('updated'),
      STATUS_ICONS.changes_made,
      getStatusHistoryEntry('draft')?.createdAt,
      'Edits made'
    ),
    createTimelineItem(
      'payment_started',
      STATUS_LABELS.payment_started,
      () => mailPiece.paymentStatus !== 'pending',
      STATUS_ICONS.payment_started,
      getStatusHistoryEntry('pending_payment')?.createdAt,
      'Payment initiated'
    ),
    createTimelineItem(
      'payment_completed_detail',
      STATUS_LABELS.paid,
      () => mailPiece.paymentStatus === 'paid',
      STATUS_ICONS.paid,
      getStatusHistoryEntry('paid')?.createdAt,
      'Payment successful'
    ),
    createTimelineItem(
      'payment_failed',
      STATUS_LABELS.payment_failed,
      () => mailPiece.paymentStatus === 'failed',
      STATUS_ICONS.payment_failed,
      getStatusHistoryEntry('failed')?.createdAt,
      'Payment failed'
    ),
    createTimelineItem(
      'payment_refunded',
      STATUS_LABELS.payment_refunded,
      () => mailPiece.paymentStatus === 'refunded',
      STATUS_ICONS.payment_refunded,
      getStatusHistoryEntry('refunded')?.createdAt,
      'Refund processed'
    ),
    createTimelineItem(
      'submitted',
      STATUS_LABELS.submitted,
      () => isStatusGroupCompleted(STATUS_GROUPS.PROCESSING),
      STATUS_ICONS.submitted,
      getStatusHistoryEntry('submitted')?.createdAt,
      'Submitted for processing'
    ),
    createTimelineItem(
      'processing_detail',
      STATUS_LABELS.processing,
      () => isStatusGroupCompleted(STATUS_GROUPS.PROCESSING),
      STATUS_ICONS.processing,
      getStatusHistoryEntry('processing')?.createdAt,
      'Processing in progress'
    ),
    createTimelineItem(
      'printed_detail',
      STATUS_LABELS.printed,
      () => isStatusGroupCompleted(STATUS_GROUPS.PRINTED),
      STATUS_ICONS.printed,
      getStatusHistoryEntry('printed')?.createdAt,
      'Printing completed'
    ),
    createTimelineItem(
      'mailed_detail',
      STATUS_LABELS.mailed,
      () => isStatusGroupCompleted(STATUS_GROUPS.MAILED),
      STATUS_ICONS.mailed,
      getStatusHistoryEntry('mailed')?.createdAt,
      'Mail dispatched'
    ),
    createTimelineItem(
      'rerouted',
      STATUS_LABELS.rerouted,
      () => !!getStatusHistoryEntry('rerouted'),
      STATUS_ICONS.rerouted,
      getStatusHistoryEntry('rerouted')?.createdAt,
      'Mail re-routed'
    ),
    createTimelineItem(
      'destination_detail',
      STATUS_LABELS.in_transit,
      () => isStatusGroupCompleted(STATUS_GROUPS.IN_TRANSIT),
      STATUS_ICONS.in_transit,
      getStatusHistoryEntry('in_transit')?.createdAt,
      'At destination facility'
    ),
    createTimelineItem(
      'delivered_detail',
      STATUS_LABELS.delivered,
      () => mailPiece.status === 'delivered',
      STATUS_ICONS.delivered,
      getStatusHistoryEntry('delivered')?.createdAt,
      'Successfully delivered'
    ),
    createTimelineItem(
      'returned_detail',
      STATUS_LABELS.returned,
      () => mailPiece.status === 'returned',
      STATUS_ICONS.returned,
      getStatusHistoryEntry('returned')?.createdAt,
      'Returned to sender'
    ),
    createTimelineItem(
      'failed_detail',
      STATUS_LABELS.failed,
      () => mailPiece.status === 'failed',
      STATUS_ICONS.failed,
      getStatusHistoryEntry('failed')?.createdAt,
      'Delivery failed'
    ),
    createTimelineItem(
      'cancelled_detail',
      STATUS_LABELS.cancelled,
      () => mailPiece.status === 'cancelled',
      STATUS_ICONS.cancelled,
      getStatusHistoryEntry('cancelled')?.createdAt,
      'Order cancelled'
    )
  ], [mailPiece, statusHistoryMap]);

  // Memoized status icon getter
  const getStatusIcon = useMemo(() => (status: TimelineItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'not_started':
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  }, []);

  // Memoized expected delivery date
  const expectedDeliveryDate = useMemo((): Date | null => {
    const deliveryEntry = mailPiece.statusHistory?.find(entry => 
      entry.expectedDeliveryDate
    );
    return deliveryEntry?.expectedDeliveryDate || null;
  }, [mailPiece.statusHistory]);

  // Timeline item renderer using useCallback for optimal memoization
  const renderTimelineItem = useCallback((item: TimelineItem) => (
    <div key={item.id} className="flex items-start space-x-3">
      <div className="flex-shrink-0 mt-0.5">
        {getStatusIcon(item.status)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {item.label}
        </p>
        {item.date && (
          <p className="text-xs text-gray-500">
            {formatDate(item.date)}
          </p>
        )}
        {item.description && (
          <p className="text-xs text-gray-400">
            {item.description}
          </p>
        )}
      </div>
    </div>
  ), [getStatusIcon]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-base">
          <Clock className="h-5 w-5 mr-2" />
          Status Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Timeline - Always Visible */}
          <div className="space-y-3">
            {mainTimelineItems.map(renderTimelineItem)}
          </div>

          {/* Expected Delivery Date */}
          {expectedDeliveryDate && (
            <div className="pt-3 border-t border-gray-200">
              <p className="text-sm font-medium text-gray-900">
                Expected Delivery Date: {formatDate(expectedDeliveryDate)}
              </p>
            </div>
          )}

          {/* View Details Section */}
          <div className="pt-3 border-t border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              <span>View Details</span>
            </Button>

            {showDetails && (
              <div className="mt-4 space-y-3">
                {detailedTimelineItems.map(renderTimelineItem)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}