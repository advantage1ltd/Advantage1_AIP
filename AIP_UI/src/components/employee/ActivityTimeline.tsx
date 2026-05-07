import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { CATEGORY_COLORS, STATUS_COLORS } from '@/config/activityConfig';
import type { EmployeeActivity } from '@/types/employee';

interface ActivityTimelineProps {
  activity: EmployeeActivity;
  onEdit: (activity: EmployeeActivity) => void;
  onDelete: (id: string) => void;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  activity,
  onEdit,
  onDelete,
}) => {
  const categoryColor = CATEGORY_COLORS[activity.activityCategory];
  const statusColor = STATUS_COLORS[activity.status];

  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div className="absolute left-4 top-10 -bottom-8 w-px bg-border last:bg-transparent" />
      
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold">{activity.employeeName}</h4>
              <Badge variant="outline" className={cn("font-normal", categoryColor)}>
                {activity.activityType}
              </Badge>
              <Badge variant="outline" className={cn("font-normal", statusColor)}>
                {activity.status}
              </Badge>
              {activity.actionRequired && (
                <Badge variant="destructive">
                  Action Required {activity.actionDeadline && `by ${format(activity.actionDeadline, 'dd MMM yyyy')}`}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(activity.activityDate, 'dd MMM yyyy, HH:mm')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(activity)}
                    className="h-10 px-3 hover:bg-blue-100 hover:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit activity</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit activity</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(activity.id)}
                    className="h-10 px-3 hover:bg-red-100 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete activity</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete activity</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <p className="text-sm">{activity.description}</p>

        {(activity.attachments?.length > 0 || activity.notes || activity.relatedDocuments?.length > 0) && (
          <div className="mt-2 space-y-2">
            {activity.attachments?.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Paperclip className="h-4 w-4" />
                <span>{activity.attachments.length} attachment(s)</span>
              </div>
            )}
            {activity.notes && (
              <p className="text-sm text-muted-foreground">
                <strong>Notes:</strong> {activity.notes}
              </p>
            )}
            {activity.relatedDocuments?.length > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Related documents: {activity.relatedDocuments.join(', ')}</span>
              </div>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>Recorded by {activity.recordedBy}</span>
          <span>Source: {activity.source}</span>
          {activity.sourceReference && (
            <span>Ref: {activity.sourceReference}</span>
          )}
          {activity.nextReviewDate && (
            <span>Next review: {format(activity.nextReviewDate, 'dd MMM yyyy')}</span>
          )}
        </div>
      </div>
    </div>
  );
}; 