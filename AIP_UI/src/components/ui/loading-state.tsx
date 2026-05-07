import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8"
};

export const LoadingSpinner = ({ 
  size = "md",
  className 
}: LoadingSpinnerProps) => {
  return (
    <Loader2 
      className={cn(
        "animate-spin text-primary",
        sizeMap[size],
        className
      )} 
    />
  );
};

interface LoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingState = ({
  message = "Loading...",
  size = "md",
  className
}: LoadingStateProps) => {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <LoadingSpinner size={size} />
      <span className="text-muted-foreground text-sm">{message}</span>
    </div>
  );
};

export const withLoadingState = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  loadingProps?: Partial<LoadingStateProps>
) => {
  return ({ isLoading, ...props }: P & { isLoading: boolean }) => {
    if (isLoading) {
      return <LoadingState {...loadingProps} />;
    }
    return <WrappedComponent {...props as P} />;
  };
}; 