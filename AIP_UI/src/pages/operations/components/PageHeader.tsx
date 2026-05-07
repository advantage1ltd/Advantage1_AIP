import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { PageHeaderProps } from '@/types/header';
import { headerService } from '@/services/headerService';
import { LoadingSpinner } from '@/components/ui/loading-state';

export const PageHeader: React.FC<PageHeaderProps> = ({
  pageId,
  showForm = false,
  isEditing = false,
  formType = '',
  className = '',
  children,
  onTitleChange,
  onDescriptionChange,
  customizations = {}
}) => {
  const queryClient = useQueryClient();

  // Fetch header data
  const {
    data: headerData,
    isLoading,
    error
  } = useQuery({
    queryKey: ['headerData', pageId],
    queryFn: () => headerService.getHeaderData(pageId)
  });

  // Update header data mutation
  const { mutate: updateHeader } = useMutation({
    mutationFn: (data: { title: string; description: string }) =>
      headerService.updateHeaderData(pageId, {
        ...headerData,
        ...data,
        customizations
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['headerData', pageId] });
    }
  });

  // Handle title change
  const handleTitleChange = (title: string) => {
    onTitleChange?.(title);
    updateHeader({ title, description: headerData?.description || '' });
  };

  // Handle description change
  const handleDescriptionChange = (description: string) => {
    onDescriptionChange?.(description);
    updateHeader({ title: headerData?.title || '', description });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full h-24 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Error state - fail silently, just use fallback values
  // if (error) {
  //   return (
  //     <Alert variant="destructive" className="mb-6">
  //       <AlertCircle className="h-4 w-4" />
  //       <AlertDescription>Failed to load header data</AlertDescription>
  //     </Alert>
  //   );
  // }

  // Generate title based on form state
  const getTitle = () => {
    if (showForm) {
      return isEditing
        ? `Edit ${formType}`
        : `New ${formType}`;
    }
    return headerData?.title || formType;
  };

  // Generate description based on form state
  const getDescription = () => {
    if (showForm) {
      return isEditing
        ? `Update the ${formType.toLowerCase()} details below`
        : `Fill in the ${formType.toLowerCase()} details below. Required fields are marked with an asterisk (*)`;
    }
    return headerData?.description || '';
  };

  const {
    titleSize = '2xl',
    showDescription = true,
    className: customClassName = ''
  } = customizations;

  return (
    <div className={cn(
      'space-y-1 sm:space-y-2 md:space-y-3 mb-4 sm:mb-5 md:mb-6',
      className,
      customClassName
    )}>
      <h1 className={cn(
        'font-semibold tracking-tight',
        {
          'text-lg sm:text-xl md:text-2xl': titleSize === '2xl',
          'text-xl sm:text-2xl md:text-3xl': titleSize === '3xl',
          'text-base sm:text-lg md:text-xl': titleSize === 'xl',
          'text-sm sm:text-base md:text-lg': titleSize === 'lg',
          'text-xs sm:text-sm md:text-base': titleSize === 'md',
          'text-xs sm:text-xs md:text-sm': titleSize === 'sm',
        }
      )}>
        {getTitle()}
      </h1>
      
      {showDescription && (
        <p className="text-xs sm:text-sm text-muted-foreground">
          {getDescription()}
        </p>
      )}

      {children}
    </div>
  );
}; 