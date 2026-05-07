import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardGreetingProps {
  className?: string;
  showLastLogin?: boolean;
}

export const DashboardGreeting = ({ 
  className = '',
  showLastLogin = true,
}: DashboardGreetingProps) => {
  const { user, isLoading, error } = useAuth();
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good Morning');
      else if (hour < 17) setGreeting('Good Afternoon');
      else setGreeting('Good Evening');
    };

    updateGreeting();

    // Update greeting every hour
    const timer = setInterval(updateGreeting, 3600000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className={`p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 shadow-sm ${className}`}>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className={`p-6 rounded-lg bg-red-50 dark:bg-red-900/10 shadow-sm ${className}`}
        role="alert"
      >
        <div className="text-red-800 dark:text-red-400">
          <h1 className="text-lg font-semibold">Authentication Error</h1>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // If no user data, show a generic greeting
  if (!user) {
    return (
      <div 
        className={`p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 shadow-sm ${className}`}
        role="region"
        aria-label="Dashboard greeting"
      >
        <div>
          <h1 
            className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2"
            tabIndex={0}
          >
            {greeting}, Welcome!
          </h1>
          <p 
            className="text-gray-600 dark:text-gray-300 text-base md:text-lg mb-4"
            tabIndex={0}
          >
            Please log in to view your personalized dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`p-6 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 shadow-sm ${className}`}
      role="region"
      aria-label="Dashboard greeting"
    >
      <div>
        <h1 
          className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white mb-2"
          tabIndex={0}
        >
          {greeting}, {user.firstName} {user.lastName}!
        </h1>
        <p 
          className="text-gray-600 dark:text-gray-300 text-base md:text-lg mb-4"
          tabIndex={0}
        >
          Welcome back to your dashboard. Here's what's happening today.
        </p>
        {showLastLogin && user.lastLogin && (
          <p 
            className="text-sm text-gray-500 dark:text-gray-400"
            tabIndex={0}
          >
            Last login: {format(new Date(user.lastLogin), 'MMM d, yyyy h:mm a')}
          </p>
        )}
      </div>
    </div>
  );
};

export default DashboardGreeting; 