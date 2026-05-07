import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { CustomerSurvey } from '@/types/customerSatisfaction';
import { format } from 'date-fns';

interface MobileSurveyCardProps {
  survey: CustomerSurvey;
  onEdit?: (survey: CustomerSurvey) => void;
  onView: (survey: CustomerSurvey) => void;
  onDelete?: (id: string) => void;
  isCustomerView?: boolean;
}

export const MobileSurveyCard: React.FC<MobileSurveyCardProps> = ({
  survey,
  onEdit,
  onView,
  onDelete,
  isCustomerView = false
}) => {
  // Calculate average rating
  const ratings = Object.values(survey.ratings);
  const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;

  return (
    <Card className="p-4 mb-4">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-sm">{survey.officerName}</h3>
            <p className="text-xs text-gray-500">{format(new Date(survey.date), 'PPP')}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => onView(survey)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => onEdit(survey)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 text-destructive" 
              onClick={() => onDelete(survey.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="text-gray-500">Customer</p>
            <p className="font-medium">{survey.customer}</p>
          </div>
          <div>
            <p className="text-gray-500">Location</p>
            <p className="font-medium">{survey.siteName}</p>
          </div>
          <div>
            <p className="text-gray-500">Region</p>
            <p className="font-medium">{survey.region}</p>
          </div>
          <div>
            <p className="text-gray-500">Average Rating</p>
            <p className="font-medium">{averageRating.toFixed(1)}/10</p>
          </div>
        </div>

        {/* Follow-up Actions */}
        {survey.followUpActions.length > 0 && (
          <div className="text-xs">
            <p className="text-gray-500 mb-1">Follow-up Actions</p>
            <div className="space-y-1">
              {survey.followUpActions.map((action, index) => (
                <div key={index} className="flex justify-between">
                  <p className="truncate flex-1">{action}</p>
                  <p className="text-gray-500 ml-2">
                    {format(new Date(survey.datesToBeCompleted[index]), 'PP')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}; 