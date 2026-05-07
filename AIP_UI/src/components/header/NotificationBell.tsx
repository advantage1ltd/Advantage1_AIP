import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import { useUserTaskCount } from "@/hooks/useUserTaskCount";

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell = ({ className = "" }: NotificationBellProps) => {
  const { taskCount, isLoading } = useUserTaskCount();

  // Only show badge if there are tasks
  const showBadge = taskCount > 0;

  return (
    <Link 
      to="/action-calendar" 
      className={`relative p-1 transition-colors ${className}`}
      aria-label={`Notifications - ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}`}
    >
      <Bell className="h-5 w-5" />
      {showBadge && !isLoading && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-red-500 flex items-center justify-center text-[11px] font-medium text-white">
          {taskCount > 99 ? '99+' : taskCount}
        </span>
      )}
    </Link>
  );
}; 