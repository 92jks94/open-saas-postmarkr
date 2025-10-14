import { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown } from "lucide-react"
import { type User } from 'wasp/entities'
import { Button } from '../../../components/ui/button'
import { Switch } from '../../../components/ui/switch'
import DropdownEditDelete from './DropdownEditDelete'
import { useAuth } from 'wasp/client/auth'
import { updateIsUserAdminById } from 'wasp/client/operations'

function AdminSwitch({ id, isAdmin }: Pick<User, 'id' | 'isAdmin'>) {
  const { data: currentUser } = useAuth();
  const isCurrentUser = currentUser?.id === id;

  const handleAdminToggle = async (value: boolean) => {
    try {
      await updateIsUserAdminById({ id, isAdmin: value });
    } catch (error) {
      console.error('Failed to update admin status:', error);
      alert('Failed to update admin status. Please try again.');
    }
  };

  return (
    <Switch
      checked={isAdmin}
      onCheckedChange={handleAdminToggle}
      disabled={isCurrentUser}
    />
  );
}

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const email = row.getValue("email") as string | null
      return (
        <div className="flex flex-col gap-1">
          <p className="text-sm text-foreground">{email || 'N/A'}</p>
        </div>
      )
    },
  },
  {
    accessorKey: "username",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Username
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const username = row.getValue("username") as string | null
      return <p className="text-sm text-foreground">{username || 'N/A'}</p>
    },
  },
  {
    accessorKey: "subscriptionStatus",
    header: "Subscription Status",
    cell: ({ row }) => {
      const status = row.getValue("subscriptionStatus") as string | null
      return <p className="text-sm text-foreground">{status || 'None'}</p>
    },
  },
  {
    accessorKey: "paymentProcessorUserId",
    header: "Stripe ID",
    cell: ({ row }) => {
      const stripeId = row.getValue("paymentProcessorUserId") as string | null
      return <p className="text-sm text-muted-foreground">{stripeId || 'N/A'}</p>
    },
  },
  {
    accessorKey: "isAdmin",
    header: "Is Admin",
    cell: ({ row }) => {
      return <AdminSwitch {...row.original} />
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original
      return (
        <DropdownEditDelete 
          userId={user.id} 
          isAdmin={user.isAdmin} 
          userEmail={user.email || 'Unknown User'} 
        />
      )
    },
  },
]

