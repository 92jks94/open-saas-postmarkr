import { Ellipsis, SquarePen, User } from 'lucide-react';
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
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggleAdmin = async () => {
    try {
      setIsUpdating(true);
      await updateIsUserAdminById({ id: userId, isAdmin: !isAdmin });
      // The parent component will refetch data automatically
    } catch (error) {
      console.error('Error updating admin status:', error);
      alert('Failed to update admin status. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleViewUserDetails = () => {
    // For now, just show an alert with user info
    // In the future, this could navigate to a user details page
    alert(`User Details:\nEmail: ${userEmail}\nAdmin Status: ${isAdmin ? 'Yes' : 'No'}\nUser ID: ${userId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Ellipsis className='size-4' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem onClick={handleToggleAdmin} disabled={isUpdating}>
          <SquarePen className='size-4 mr-2' />
          {isUpdating ? 'Updating...' : (isAdmin ? 'Remove Admin' : 'Make Admin')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleViewUserDetails}>
          <User className='size-4 mr-2' />
          View Details
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default DropdownEditDelete;
