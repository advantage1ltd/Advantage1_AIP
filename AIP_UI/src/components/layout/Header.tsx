import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { logout } from '@/services/auth';

export function Header() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    try {
      logout();
      toast({
        title: 'Logged out successfully',
        description: 'You have been logged out of your account.',
        duration: 3000,
      });
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: 'Logout failed',
        description: 'There was an error logging out. Please try again.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        <div className="flex-1" />
        <Button 
          variant="outline" 
          onClick={handleLogout}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Logout
        </Button>
      </div>
    </header>
  );
} 