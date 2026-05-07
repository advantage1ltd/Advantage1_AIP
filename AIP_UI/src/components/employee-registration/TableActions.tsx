import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, UserPlus } from "lucide-react"

interface TableActionsProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  onNewEmployee: () => void
}

export function TableActions({ searchQuery, onSearchChange, onNewEmployee }: TableActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-1 w-full">
        <div className="relative flex-1 w-full sm:w-[400px]">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          <Input 
            placeholder="Search employees..." 
            className="pl-10 h-11 text-base bg-white border-2 border-gray-200 hover:border-gray-300 focus:border-[#324053] focus:ring-2 focus:ring-[#324053]/20 rounded-lg shadow-sm" 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <Button 
        onClick={onNewEmployee} 
        style={{ backgroundColor: '#324053' }}
        className="w-full sm:w-auto h-11 px-4 sm:px-6 hover:opacity-90 shadow-sm"
      >
        <UserPlus className="mr-2 h-4 w-4" />
        New Employee
      </Button>
    </div>
  )
}