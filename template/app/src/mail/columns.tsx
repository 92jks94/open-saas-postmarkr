import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, CheckCircle, XCircle, AlertCircle, Package, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import type { MailPiece, MailAddress } from "wasp/entities";

/**
 * Mail piece type with relations for table display
 * Includes sender/recipient addresses and file information
 */
export type MailPieceWithRelations = MailPiece & {
  senderAddress: MailAddress | null;
  recipientAddress: MailAddress | null;
  file: { id: string; name: string; key: string } | null;
};

/**
 * Returns appropriate status icon based on mail piece status
 * Exported for reuse in other components
 */
export const getStatusIcon = (status: string) => {
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

/**
 * Returns badge variant based on mail piece status
 * Exported for reuse in other components
 */
export const getStatusBadgeVariant = (status: string): "default" | "destructive" | "secondary" | "outline" => {
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

/**
 * Formats currency amount for display
 * Exported for reuse in other components
 */
export const formatCurrency = (amount: number | null | undefined) => {
  if (!amount) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

/**
 * Formats date for display
 * Exported for reuse in other components
 */
export const formatDate = (date: Date | string) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Creates column definitions for mail pieces
 * @param onSort - Optional sort handler for server-side sorting
 * @returns Array of column definitions for TanStack Table
 * 
 * @example
 * ```tsx
 * // Basic usage
 * const columns = createMailPieceColumns();
 * 
 * // With server-side sorting
 * const columns = createMailPieceColumns((field) => {
 *   setServerSort({ field, direction: 'asc' });
 * });
 * ```
 */
export const createMailPieceColumns = (
  onSort?: (field: string) => void
): ColumnDef<MailPieceWithRelations>[] => [
  {
    accessorKey: "description",
    header: () => {
      return onSort ? (
        <Button
          variant="ghost"
          onClick={() => onSort('description')}
        >
          Description
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) : "Description"
    },
    cell: ({ row }) => {
      const description = row.getValue("description") as string | null;
      return (
        <div className="font-medium text-foreground">
          {description || 'Untitled Mail Piece'}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: () => {
      return onSort ? (
        <Button
          variant="ghost"
          onClick={() => onSort('status')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) : "Status"
    },
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <Badge variant={getStatusBadgeVariant(status)}>
            {status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "mailType",
    header: () => {
      return onSort ? (
        <Button
          variant="ghost"
          onClick={() => onSort('mailType')}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) : "Type"
    },
    cell: ({ row }) => {
      const mailType = row.getValue("mailType") as string;
      return <span className="text-sm text-foreground">{mailType}</span>;
    },
  },
  {
    accessorKey: "mailClass",
    header: "Class",
    cell: ({ row }) => {
      const mailClass = row.getValue("mailClass") as string;
      return <span className="text-sm text-foreground">{mailClass}</span>;
    },
  },
  {
    accessorKey: "mailSize",
    header: "Size",
    cell: ({ row }) => {
      const mailSize = row.getValue("mailSize") as string;
      return <span className="text-sm text-foreground">{mailSize}</span>;
    },
  },
  {
    id: "sender",
    accessorFn: (row) => row.senderAddress?.contactName,
    header: "From",
    cell: ({ row }) => {
      const senderName = row.original.senderAddress?.contactName;
      return <span className="text-sm text-foreground">{senderName || 'N/A'}</span>;
    },
  },
  {
    id: "recipient",
    accessorFn: (row) => row.recipientAddress?.contactName,
    header: "To",
    cell: ({ row }) => {
      const recipientName = row.original.recipientAddress?.contactName;
      return <span className="text-sm text-foreground">{recipientName || 'N/A'}</span>;
    },
  },
  {
    accessorKey: "cost",
    header: () => {
      return onSort ? (
        <Button
          variant="ghost"
          onClick={() => onSort('cost')}
        >
          Cost
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) : "Cost"
    },
    cell: ({ row }) => {
      const cost = row.getValue("cost") as number | null;
      return <span className="text-sm font-medium text-foreground">{formatCurrency(cost)}</span>;
    },
  },
  {
    accessorKey: "createdAt",
    header: () => {
      return onSort ? (
        <Button
          variant="ghost"
          onClick={() => onSort('createdAt')}
        >
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ) : "Created"
    },
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as Date;
      return <span className="text-xs text-muted-foreground">{formatDate(createdAt)}</span>;
    },
  },
  {
    accessorKey: "lobTrackingNumber",
    header: "Tracking",
    cell: ({ row }) => {
      const tracking = row.getValue("lobTrackingNumber") as string | null;
      return tracking ? (
        <span className="text-xs font-mono text-muted-foreground">{tracking}</span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      );
    },
  },
];

/**
 * Pre-configured mail piece columns without sorting
 * Use this for simple table/card displays without server-side sorting
 */
export const mailPieceColumns = createMailPieceColumns();

