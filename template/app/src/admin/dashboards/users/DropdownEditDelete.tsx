import { Ellipsis, SquarePen, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { updateIsUserAdminById } from 'wasp/client/operations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../../components/ui/dropdown-menu';
import { Button } from '../../../components/ui/button';

interface DropdownEditDeleteProps {
  userId: string;
  isAdmin: boolean;
  userEmail: string;
}

const DropdownEditDelete = ({ userId, isAdmin, userEmail }: DropdownEditDeleteProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleAdmin = async () => {
    try {
      await updateIsUserAdminById({ id: userId, isAdmin: !isAdmin });
      // The parent component will refetch data automatically
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status. Please try again.');
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm(`Are you sure you want to delete user ${userEmail}? This action cannot be undone.`)) {
      return;
    }

    try {
      setIsDeleting(true);
      // Note: There's no deleteUser operation in the current operations
      // This would need to be implemented in the backend
      alert('User deletion is not yet implemented. Please contact the development team.');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Ellipsis className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem onClick={handleToggleAdmin}>
          <SquarePen className='size-4 mr-2' />
          {isAdmin ? 'Remove Admin' : 'Make Admin'}
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDeleteUser}
          disabled={isDeleting}
          className="text-red-600"
        >
          <Trash2 className='size-4 mr-2' />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownEditDelete;
