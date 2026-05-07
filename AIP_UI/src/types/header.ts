export interface PageHeaderData {
  title: string;
  description: string;
  customizations?: {
    titleSize?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    showDescription?: boolean;
    showBreadcrumbs?: boolean;
    showActions?: boolean;
    className?: string;
  };
}

export interface PageHeaderProps extends PageHeaderData {
  pageId: string;
  showForm?: boolean;
  isEditing?: boolean;
  formType?: string;
  className?: string;
  children?: React.ReactNode;
  onTitleChange?: (title: string) => void;
  onDescriptionChange?: (description: string) => void;
} 