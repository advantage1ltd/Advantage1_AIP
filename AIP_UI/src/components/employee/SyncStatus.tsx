import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ActivitySource, ActivitySyncStatus } from '@/types/employee';
import { ACTIVITY_SOURCES } from '@/config/activityConfig';
import { format } from 'date-fns';
import { Loader2, Power } from 'lucide-react';

// Extended interface to include optional error message
interface ExtendedActivitySyncStatus extends ActivitySyncStatus {
  errorMessage?: string;
}

interface SyncStatusProps {
  sources: Record<ActivitySource, ActivitySyncStatus>;
  onSync: (source: ActivitySource) => void;
  isSyncing: boolean;
  onToggleStatus?: (source: ActivitySource) => void;
  showLabels?: boolean;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({
  sources,
  onSync,
  isSyncing,
  onToggleStatus,
  showLabels = false,
}) => {
  console.log("SyncStatus received props:", { 
    sources: Object.keys(sources).length,
    isSyncing,
    hasToggleFunction: !!onToggleStatus,
    showLabels
  });
  
  return (
    <div className="flex flex-wrap items-center gap-2">
      <TooltipProvider>
        {Object.entries(sources).map(([sourceKey, status]) => {
          const source = sourceKey as ActivitySource;
          const sourceConfig = ACTIVITY_SOURCES[source];
          // Cast to extended type to allow access to errorMessage
          const extendedStatus = status as ExtendedActivitySyncStatus;
          
          if (!sourceConfig) return null;
          
          return (
            <Tooltip key={source}>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 my-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={status.status === 'inactive' || isSyncing}
                    onClick={() => onSync(source)}
                    className="flex items-center gap-1 xs:gap-2 h-7 xs:h-8 text-[10px] xs:text-xs px-1.5 xs:px-2"
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      status.status === 'active' ? 'bg-green-500' :
                      status.status === 'error' ? 'bg-red-500' :
                      'bg-gray-300'
                    }`} />
                    <span className="text-sm">{sourceConfig.label}</span>
                    {isSyncing && source === 'manual' && (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    )}
                  </Button>
                  
                  {onToggleStatus && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onToggleStatus(source)}
                      className="h-8 w-8 p-0"
                      title={`${status.status === 'active' ? 'Disable' : 'Enable'} synchronization`}
                    >
                      <Power className={`h-3 w-3 xs:h-4 xs:w-4 ${status.status === 'active' ? 'text-green-500' : 'text-gray-400'}`} />
                      {showLabels && (
                        <span className="ml-1 text-[10px] xs:text-xs hidden md:inline">
                          {status.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-2">
                  <p className="font-medium">{sourceConfig.description}</p>
                  {status.lastSynced && (
                    <p className="text-xs text-gray-500">
                      Last synced: {format(status.lastSynced, 'PPp')}
                    </p>
                  )}
                  {status.status === 'error' && extendedStatus.errorMessage && (
                    <Badge variant="destructive" className="mt-1">
                      {extendedStatus.errorMessage}
                    </Badge>
                  )}
                  {sourceConfig.syncInterval > 0 && (
                    <p className="text-xs text-gray-500">
                      Auto-syncs every {sourceConfig.syncInterval / (60 * 1000)} minutes
                    </p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}; 