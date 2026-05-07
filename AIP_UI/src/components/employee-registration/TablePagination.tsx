import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface TablePaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  itemsPerPage?: number
  totalItems?: number
  startIndex?: number
}

export function TablePagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage = 10,
  totalItems = 0,
  startIndex = 0
}: TablePaginationProps) {
  if (totalPages <= 0) return null

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-2 px-0 text-xs sm:text-sm">
      <div className="text-gray-500 mb-2 sm:mb-0">
        {totalItems > 0 && (
          <span>
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, totalItems)} of {totalItems} results
          </span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="h-8 px-2 sm:h-9 sm:px-3 border-purple-200 hover:bg-purple-50"
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
          <span className="hidden sm:inline">Previous</span>
        </Button>
        <div className="text-gray-500 min-w-[80px] text-center">
          Page {currentPage} of {Math.max(totalPages, 1)}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="h-8 px-2 sm:h-9 sm:px-3 border-purple-200 hover:bg-purple-50"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 sm:ml-1" />
        </Button>
      </div>
    </div>
  )
}