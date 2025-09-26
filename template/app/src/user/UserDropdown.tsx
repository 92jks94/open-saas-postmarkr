import { ChevronDown, LogOut, Moon, Sun, User } from 'lucide-react';
import { useState } from 'react';
import { logout } from 'wasp/client/auth';
import { Link as WaspRouterLink } from 'wasp/client/router';
import { type User as UserEntity } from 'wasp/entities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import useColorMode from '../client/hooks/useColorMode';
import { userMenuItems } from './constants';

export default function UserDropdown({ user }: { user: Partial<UserEntity> }) {
  const [open, setOpen] = useState(false);
  const [colorMode, setColorMode] = useColorMode();
  const isInLightMode = colorMode === 'light';

  const handleThemeToggle = () => {
    if (typeof setColorMode === 'function') {
      setColorMode(isInLightMode ? 'dark' : 'light');
    }
    setOpen(false);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button className='flex items-center duration-300 ease-in-out text-foreground hover:text-primary transition-colors'>
          <span className='hidden mr-2 text-right lg:block text-sm font-medium text-foreground'>
            {user.username}
          </span>
          <User className='size-5' />
          <ChevronDown className='size-4' />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {userMenuItems.map((item) => {
          if (item.isAuthRequired && !user) return null;
          if (item.isAdminOnly && (!user || !user.isAdmin)) return null;

          return (
            <DropdownMenuItem key={item.name}>
              <WaspRouterLink
                to={item.to}
                onClick={() => {
                  setOpen(false);
                }}
                className='flex items-center gap-3 w-full'
              >
                <item.icon size='1.1rem' />
                {item.name}
              </WaspRouterLink>
            </DropdownMenuItem>
          );
        })}
        
        <DropdownMenuSeparator />
        
        {/* Theme Toggle */}
        <DropdownMenuItem>
          <button 
            type='button' 
            onClick={handleThemeToggle} 
            className='flex items-center gap-3 w-full'
          >
            {isInLightMode ? (
              <Moon size='1.1rem' />
            ) : (
              <Sun size='1.1rem' />
            )}
            {isInLightMode ? 'Dark Mode' : 'Light Mode'}
          </button>
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem>
          <button type='button' onClick={() => logout()} className='flex items-center gap-3 w-full'>
            <LogOut size='1.1rem' />
            Log Out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
