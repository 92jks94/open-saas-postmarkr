import { ColumnDef } from "@tanstack/react-table";
import { FileText, Image, Download, Trash2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import type { File } from "wasp/entities";
import { formatFileSize } from "./validation";

/**
 * Creates column definitions for uploaded files
 * @param onDownload - Handler for downloading a file
 * @param onDelete - Handler for deleting a file
 * @returns Array of column definitions for TanStack Table
 */
export const createFileColumns = (
  onDownload: (file: File) => void,
  onDelete: (id: string) => void
): ColumnDef<File>[] => [
  {
    accessorKey: "name",
    header: "File Name",
    cell: ({ row }) => {
      const name = row.getValue("name") as string;
      const type = row.original.type;
      return (
        <div className="flex items-center gap-2">
          {type.includes('pdf') ? (
            <FileText className="h-4 w-4 text-red-500" />
          ) : (
            <Image className="h-4 w-4 text-blue-500" />
          )}
          <span className="font-medium truncate max-w-xs">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("type") as string;
      const displayType = type.split('/')[1]?.toUpperCase() || type;
      return <span className="text-sm text-muted-foreground">{displayType}</span>;
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => {
      const size = row.getValue("size") as number;
      return <span className="text-sm">{formatFileSize(size)}</span>;
    },
  },
  {
    accessorKey: "validationStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("validationStatus") as string;
      const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", icon: React.ReactNode, label: string }> = {
        valid: {
          variant: "default",
          icon: <CheckCircle className="h-3 w-3" />,
          label: "Valid"
        },
        processing: {
          variant: "secondary",
          icon: <Clock className="h-3 w-3" />,
          label: "Processing"
        },
        invalid: {
          variant: "destructive",
          icon: <XCircle className="h-3 w-3" />,
          label: "Invalid"
        },
        pending: {
          variant: "outline",
          icon: <Clock className="h-3 w-3" />,
          label: "Pending"
        }
      };

      const config = statusConfig[status] || statusConfig.pending;

      return (
        <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
          {config.icon}
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "pageCount",
    header: "Pages",
    cell: ({ row }) => {
      const pageCount = row.getValue("pageCount") as number | null;
      return pageCount ? (
        <span className="text-sm">{pageCount}</span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Uploaded",
    cell: ({ row }) => {
      const date = row.getValue("createdAt") as Date;
      return (
        <span className="text-xs text-muted-foreground">
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </span>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const file = row.original;
      return (
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              onDownload(file);
            }}
            title="Download file"
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Are you sure you want to delete "${file.name}"?`)) {
                onDelete(file.id);
              }
            }}
            title="Delete file"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

/**
 * Pre-configured file columns without handlers
 * Use this for simple display without download/delete functionality
 */
export const fileColumns = createFileColumns(() => {}, () => {});

