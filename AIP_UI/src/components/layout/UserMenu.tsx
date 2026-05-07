import { Settings as SettingsIcon, LogOut, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { USER_DATA } from '@/constants/header';
import { UserAvatar } from '../common/UserAvatar';
import { logout } from '@/services/auth';
import { getUser } from '@/services/auth';

interface UserMenuProps {
  className?: string;
}

export const UserMenu = ({ className = '' }: UserMenuProps) => {
  const navigate = useNavigate();
  const authenticatedUser = getUser();
  const canAccessSettings = authenticatedUser?.role?.toLowerCase?.() === 'administrator';

	const displayName = authenticatedUser
		? `${authenticatedUser.firstName ?? ''} ${authenticatedUser.lastName ?? ''}`.trim() || authenticatedUser.username
		: USER_DATA.name

	const displayEmail = authenticatedUser?.email || authenticatedUser?.username || USER_DATA.email

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className={`relative rounded-full ${className}`}>
          <UserAvatar size="sm" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" className="flex items-center">
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        {canAccessSettings && (
          <DropdownMenuItem asChild>
            <Link to="/settings" className="flex items-center">
              <SettingsIcon className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 