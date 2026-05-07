import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HolidayRequest, HolidayFormData } from '@/types/holiday'
import { differenceInBusinessDays, parseISO } from 'date-fns'

interface HolidayRequestFormProps {
  onSubmit: (data: HolidayFormData) => void
  initialData?: HolidayRequest | null
  onCancel: () => void
  isLoading?: boolean
}

const HOLIDAY_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'other', label: 'Other' }
]

export function HolidayRequestForm({ 
  onSubmit, 
  initialData, 
  onCancel, 
  isLoading 
}: HolidayRequestFormProps) {
  const [startDate, setStartDate] = useState(initialData?.startDate || '')
  const [endDate, setEndDate] = useState(initialData?.endDate || '')
  const [totalDays, setTotalDays] = useState(0)

  const handleDateChange = (newStartDate: string, newEndDate: string) => {
    if (newStartDate && newEndDate) {
      const days = differenceInBusinessDays(
        parseISO(newEndDate),
        parseISO(newStartDate)
      ) + 1
      setTotalDays(days > 0 ? days : 0)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const data: HolidayFormData = {
      employeeId: formData.get('employeeId') as string,
      employeeName: formData.get('employeeName') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      type: formData.get('type') as HolidayRequest['type'],
      notes: formData.get('notes') as string
    }

    onSubmit(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="employeeName">Employee Name</Label>
          <Input
            id="employeeName"
            name="employeeName"
            defaultValue={initialData?.employeeName}
            required
            aria-label="Employee Name"
          />
        </div>

        <input 
          type="hidden" 
          name="employeeId" 
          value={initialData?.employeeId || "current-user-id"} 
        />

        <div className="space-y-2">
          <Label htmlFor="type">Leave Type</Label>
          <Select name="type" defaultValue={initialData?.type || 'annual'}>
            <SelectTrigger>
              <SelectValue placeholder="Select leave type" />
            </SelectTrigger>
            <SelectContent>
              {HOLIDAY_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            name="startDate"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value)
              handleDateChange(e.target.value, endDate)
            }}
            required
            min={new Date().toISOString().split('T')[0]}
            aria-label="Start Date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <Input
            id="endDate"
            name="endDate"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value)
              handleDateChange(startDate, e.target.value)
            }}
            required
            min={startDate}
            aria-label="End Date"
          />
        </div>

        <div className="space-y-2">
          <Label>Total Working Days</Label>
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
            {totalDays} working day{totalDays !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            defaultValue={initialData?.notes}
            placeholder="Any additional information..."
            className="h-32"
            aria-label="Additional Notes"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : initialData ? 'Update Request' : 'Submit Request'}
        </Button>
      </div>
    </form>
  )
} 