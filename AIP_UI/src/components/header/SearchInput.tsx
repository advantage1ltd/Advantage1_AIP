import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { COMMON_CLASSES } from "@/constants/header";

interface SearchInputProps {
  autoFocus?: boolean;
  className?: string;
}

export const SearchInput = ({ autoFocus = false, className = "" }: SearchInputProps) => (
  <div className={`relative w-full ${className}`}>
    <Search className="absolute left-2.5 top-3 h-4 w-4 text-gray-500" />
    <Input 
      type="search" 
      placeholder="Search for anything..." 
      className={COMMON_CLASSES.searchInput}
      autoFocus={autoFocus}
    />
  </div>
); 