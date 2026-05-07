import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus } from "lucide-react"

interface TableActionsProps {
  title: string
  searchQuery: string
  onSearchChange: (value: string) => void
  onNew: () => void
  searchPlaceholder: string
  newButtonText: string
}

export function TableActions({ 
  title,
  searchQuery, 
  onSearchChange, 
  onNew,
  searchPlaceholder,
  newButtonText
}: TableActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 md:gap-4">
      <h3 className="text-base font-medium md:text-lg text-gray-800 mb-2 sm:mb-0 hidden sm:block">
        {title}
      </h3>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
        <div className="relative w-full sm:w-[240px] md:w-[280px] lg:w-[320px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 md:h-4 md:w-4 text-gray-500" />
          <Input 
            placeholder={searchPlaceholder}
            className="pl-9 h-9 md:h-10 text-xs md:text-sm bg-white border border-gray-200 hover:border-gray-300 focus-visible:ring-1 focus-visible:ring-offset-0 rounded-md w-full" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button 
          onClick={onNew} 
          className="bg-[#324053] hover:bg-[#243043] h-9 md:h-10 px-3 md:px-4 shadow-sm text-xs md:text-sm w-full sm:w-auto"
        >
          <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5" />
          <span className="hidden xs:inline">{newButtonText}</span>
          <span className="xs:hidden">New</span>
        </Button>
      </div>
    </div>
  )
}
