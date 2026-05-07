import { Search } from 'lucide-react';
import { Input } from '../ui/input';

interface SearchBarProps {
  onClose: () => void;
  isOpen: boolean;
}

export const SearchBar = ({ onClose, isOpen }: SearchBarProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="absolute top-[60px] left-0 right-0 bg-[#F8F3F1] border-b md:hidden z-20">
        <div className="max-w-screen-2xl mx-auto p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-8 w-full bg-white/80 dark:bg-[#1A1A1A]"
              autoFocus
            />
          </div>
        </div>
      </div>
      <div 
        className="fixed inset-0 bg-black/20 z-10 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  );
}; 