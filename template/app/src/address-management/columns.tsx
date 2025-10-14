import { ColumnDef } from "@tanstack/react-table";
import { Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import type { MailAddress } from "wasp/entities";

/**
 * Creates column definitions for mail addresses
 * @param onEdit - Handler for editing an address
 * @param onDelete - Handler for deleting an address
 * @returns Array of column definitions for TanStack Table
 */
export const createAddressColumns = (
  onEdit: (address: MailAddress) => void,
  onDelete: (id: string) => void
): ColumnDef<MailAddress>[] => [
  {
    accessorKey: "contactName",
    header: "Contact Name",
    cell: ({ row }) => {
      const name = row.getValue("contactName") as string;
      const company = row.original.companyName;
      const isValidated = row.original.isValidated;
      
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
            {isValidated ? (
              <span title="Validated">
                <CheckCircle className="h-3 w-3 text-green-500" />
              </span>
            ) : (
              <span title="Not validated">
                <XCircle className="h-3 w-3 text-yellow-500" />
              </span>
            )}
          </div>
          {company && <span className="text-xs text-muted-foreground">{company}</span>}
        </div>
      );
    },
  },
  {
    id: "fullAddress",
    header: "Address",
    cell: ({ row }) => {
      const addr = row.original;
      return (
        <div className="text-sm">
          <div>{addr.address_line1}</div>
          {addr.address_line2 && <div>{addr.address_line2}</div>}
          <div>{addr.address_city}, {addr.address_state} {addr.address_zip}</div>
          <div className="text-xs text-muted-foreground">{addr.address_country}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "addressType",
    header: "Type",
    cell: ({ row }) => {
      const type = row.getValue("addressType") as string;
      const variantMap: Record<string, "default" | "secondary" | "outline"> = {
        sender: "default",
        recipient: "secondary",
        both: "outline",
      };
      return (
        <Badge variant={variantMap[type] || "outline"}>
          {type}
        </Badge>
      );
    },
  },
  {
    accessorKey: "label",
    header: "Label",
    cell: ({ row }) => {
      const label = row.getValue("label") as string | null;
      return label ? (
        <span className="text-sm">{label}</span>
      ) : (
        <span className="text-xs text-muted-foreground">-</span>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const address = row.original;
      return (
        <div className="flex gap-2 justify-end">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={(e) => {
              e.stopPropagation();
              onEdit(address);
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button 
            size="sm" 
            variant="destructive" 
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Are you sure you want to delete this address?')) {
                onDelete(address.id);
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];

/**
 * Pre-configured address columns without handlers
 * Use this for simple display without edit/delete functionality
 */
export const addressColumns = createAddressColumns(() => {}, () => {});

