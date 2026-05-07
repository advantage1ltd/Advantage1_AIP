import React from 'react';
import { CustomerSurvey, getRatingLabel } from './types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Building2, User, Star, Check, AlertCircle } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from 'date-fns';

interface SurveyDetailsProps {
  survey: CustomerSurvey;
  open: boolean;
  onClose: () => void;
  isCustomerView?: boolean;
}

export const SurveyDetails: React.FC<SurveyDetailsProps> = ({
  survey,
  open,
  onClose,
  isCustomerView = false
}) => {
  // Format date nicely but shorter for mobile
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get icon based on rating score for visual cues
  const getRatingIcon = (score: number) => {
    if (score <= 3) return <AlertCircle className="h-3.5 w-3.5 text-red-600" />;
    if (score <= 6) return <Check className="h-3.5 w-3.5 text-yellow-600" />;
    return <Star className="h-3.5 w-3.5 text-green-600" />;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-16px)] sm:max-w-xl max-w-md mx-auto max-h-[90vh] p-3 sm:p-4 md:p-6 overflow-hidden">
        <DialogHeader className="pb-2 space-y-1">
          <DialogTitle className="text-base sm:text-lg font-semibold">Survey Details</DialogTitle>
          <DialogDescription>
            Survey conducted on {format(new Date(survey.date), 'PPP')}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-2 -mr-2">
          <div className="space-y-4 sm:space-y-6 py-1 sm:py-2">
            {/* Basic Information */}
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>Basic Information</span>
              </h3>
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-4">
                <div className="flex flex-col text-xs sm:text-sm">
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500">Officer</span>
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" />
                    <span className="truncate text-gray-900">{survey.officerName}</span>
                  </div>
                </div>
                <div className="flex flex-col text-xs sm:text-sm">
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500">Date</span>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-400" />
                    <span className="truncate text-gray-900">{formatDate(survey.date)}</span>
                  </div>
                </div>
                <div className="flex flex-col text-xs sm:text-sm">
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500">Customer</span>
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-gray-400" />
                    <span className="truncate text-gray-900">{survey.customer}</span>
                  </div>
                </div>
                <div className="flex flex-col text-xs sm:text-sm">
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500">Location</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400" />
                    <span className="truncate text-gray-900">{survey.siteName}, {survey.region}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Ratings */}
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>Performance Ratings</span>
              </h3>
              <div className="grid gap-1.5 sm:gap-3">
                {Object.entries(survey.ratings).map(([key, score]) => (
                  <div key={key} className="flex items-center justify-between bg-gray-50 p-2 sm:p-3 rounded-md">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {getRatingIcon(score)}
                      <span className="font-medium text-gray-700 text-xs sm:text-sm truncate">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`px-2 py-0.5 text-[10px] sm:text-xs font-medium rounded-full ${
                        score <= 3 ? 'bg-red-100 text-red-700' :
                        score <= 6 ? 'bg-yellow-100 text-yellow-700' :
                        score <= 8 ? 'bg-green-100 text-green-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {getRatingLabel(score)}
                      </span>
                      <span className="text-gray-900 font-bold text-xs sm:text-sm tabular-nums">{score}/10</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Management Information */}
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>Management Information</span>
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500">Store Manager</span>
                  <p className="text-xs sm:text-sm text-gray-900 truncate">{survey.storeManagerName}</p>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] sm:text-xs font-medium text-gray-500">Area Manager</span>
                  <p className="text-xs sm:text-sm text-gray-900 truncate">{survey.areaManagerName}</p>
                </div>
              </div>
            </div>

            {/* Follow-up Actions */}
            <div className="space-y-2 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                <span>Follow-up Actions</span>
              </h3>
              <div className="space-y-1.5 sm:space-y-3">
                {survey.followUpActions.map((action, index) => (
                  action && (
                    <div key={index} className="flex flex-col xs:flex-row items-start justify-between bg-gray-50 p-2 sm:p-3 rounded-md gap-1 xs:gap-4">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className="text-xs sm:text-sm font-medium text-gray-700">
                          <span className="inline-block bg-primary/10 text-primary rounded-full w-4 h-4 text-[10px] text-center mr-1">
                            {index + 1}
                          </span>
                          Action
                        </span>
                        <p className="text-xs text-gray-600 break-words">{action}</p>
                      </div>
                      <div className="text-right xs:flex-shrink-0 text-xs w-full xs:w-auto">
                        <span className="text-[10px] font-medium text-gray-500">Due Date</span>
                        <p className="text-gray-900">
                          {formatDate(survey.datesToBeCompleted[index])}
                        </p>
                      </div>
                    </div>
                  )
                ))}
                {survey.followUpActions.filter(Boolean).length === 0 && (
                  <p className="text-xs text-gray-500 italic">No follow-up actions specified</p>
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-3 sm:mt-4">
          <Button 
            onClick={onClose}
            className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 