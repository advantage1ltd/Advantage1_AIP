import { HolidayRequest } from '@/types/holiday'
import { format } from 'date-fns'
import { Edit2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface HolidayRequestListProps {
  requests: HolidayRequest[]
  onEdit: (request: HolidayRequest) => void
  onDelete: (id: string) => void
  onStatusChange?: (id: string, status: HolidayRequest['status']) => void
  isManager?: boolean
}

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}

export function HolidayRequestList({ 
  requests, 
  onEdit, 
  onDelete,
  onStatusChange,
  isManager = false 
}: HolidayRequestListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Employee
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Date Range
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
              Days
            </th>
            <th className="px-6 py-3 relative">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {requests.map((request) => (
            <tr key={request.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {request.employeeName}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {format(new Date(request.startDate), 'MMM d, yyyy')} - 
                  {format(new Date(request.endDate), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 dark:text-gray-100">
                  {request.type.charAt(0).toUpperCase() + request.type.slice(1)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {isManager ? (
                  <Select
                    value={request.status}
                    onValueChange={(value: HolidayRequest['status']) => 
                      onStatusChange?.(request.id, value)
                    }
                  >
                    <SelectTrigger className="w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Badge className={statusColors[request.status]}>
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                {request.totalDays}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                {request.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => onEdit(request)}
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      onClick={() => onDelete(request.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
} 