import { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface IncidentDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

const maxWidthClasses = {
  sm: 'sm:max-w-[500px]',
  md: 'sm:max-w-[700px]',
  lg: 'sm:max-w-[900px]',
  xl: 'sm:max-w-[1100px]'
};

export const IncidentDialog = ({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'lg'
}: IncidentDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              View and manage incident details below.
            </DialogDescription>
        </DialogHeader>
        
        {children}
        
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};
