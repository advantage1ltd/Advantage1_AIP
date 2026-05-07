import { useState, useEffect, useMemo } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Task } from '@/pages/ActionCalendar'
import { Label } from '@/components/ui/label'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, ArrowUpCircle, MinusCircle, ArrowDownCircle, Loader2 } from 'lucide-react'
import { employeeService } from '@/services/employeeService'
import { Employee } from '@/types/employee'
import { useToast } from '@/hooks/use-toast'

interface AddTaskFormProps {
  onSubmit: (task: Omit<Task, 'id' | 'status'>) => void
  selectedDate: Date
}

const formSchema = z.object({
  title: z.string().min(3, 'Title should be at least 3 characters'),
  description: z.string().min(5, 'Description should be at least 5 characters'),
  priority: z.enum(['low', 'medium', 'high']),
  assignee: z.string().min(1, 'Please select an assignee'),
  assigneeEmail: z.string().email('Assignee email is invalid').optional(),
  date: z.date({
    required_error: 'Please select a due date'
  })
})

export function AddTaskForm({ onSubmit, selectedDate }: AddTaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('medium')
  const [assignee, setAssignee] = useState('')
  const [assigneeEmail, setAssigneeEmail] = useState<string | undefined>()
  const [date, setDate] = useState<Date>(selectedDate)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const { toast } = useToast()

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees()
  }, [])

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true)
      const activeEmployees = await employeeService.getActiveEmployees()
      setEmployees(activeEmployees)
    } catch (error) {
      console.error('Error fetching employees:', error)
      toast({
        title: 'Error',
        description: 'Failed to load employees. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setLoadingEmployees(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const validation = formSchema.safeParse({
      title,
      description,
      priority,
      assignee,
      assigneeEmail,
      date
    })

    if (!validation.success) {
      toast({
        title: 'Invalid Task',
        description: validation.error.issues[0]?.message ?? 'Please review the form inputs.',
        variant: 'destructive'
      })
      return
    }

    onSubmit({
      title,
      description,
      date,
      priority,
      assignee,
      email: assigneeEmail
    })
  }

  const employeesWithAccounts = useMemo(
    () => employees.filter(employee => employee.userId),
    [employees]
  )

  const handleAssigneeSelect = (value: string) => {
    if (value.startsWith('no-user-')) {
      return
    }

    setAssignee(value)
    const matchedEmployee = employees.find(employee => employee.userId === value)
    setAssigneeEmail(matchedEmployee?.email)
  }

  const getPriorityIcon = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
      case 'medium':
        return <MinusCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
      case 'low':
        return <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
      default:
        return null
    }
  }

  const getEmployeeDisplayName = (employee: Employee) => {
    return `${employee.firstName} ${employee.surname}${employee.employeeNumber ? ` (${employee.employeeNumber})` : ''}`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div className="space-y-1 sm:space-y-2">
        <Label htmlFor="title" className="text-sm sm:text-base">Title</Label>
        <Input
          id="title"
          placeholder="Enter task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-purple-100 focus-visible:ring-purple-500 text-sm sm:text-base"
          required
        />
      </div>
      
      <div className="space-y-1 sm:space-y-2">
        <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
        <Textarea
          id="description"
          placeholder="Enter task description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px] sm:min-h-[100px] resize-none border-purple-100 focus-visible:ring-purple-500 text-sm sm:text-base"
          required
        />
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="priority" className="text-sm sm:text-base">Priority Level</Label>
          <Select 
            value={priority} 
            onValueChange={(value: Task['priority']) => setPriority(value)}
          >
            <SelectTrigger id="priority" className="border-purple-100 focus:ring-purple-500 text-sm sm:text-base">
              <SelectValue placeholder="Select Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high" className="flex items-center gap-2 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <ArrowUpCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  High
                </div>
              </SelectItem>
              <SelectItem value="medium" className="flex items-center gap-2 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <MinusCircle className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value="low" className="flex items-center gap-2 text-sm sm:text-base">
                <div className="flex items-center gap-2">
                  <ArrowDownCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                  Low
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="assignee" className="text-sm sm:text-base">Assign To</Label>
          {employees.length > 0 && employeesWithAccounts.length === 0 && !loadingEmployees && (
            <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
              Employees without AIP user accounts cannot be assigned tasks. Create accounts under Administration → Users.
            </p>
          )}
          <Select 
            value={assignee || undefined} 
            onValueChange={handleAssigneeSelect}
            disabled={loadingEmployees || employees.length === 0}
          >
            <SelectTrigger id="assignee" className="border-purple-100 focus:ring-purple-500 text-sm sm:text-base">
              {loadingEmployees ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading employees...</span>
                </div>
              ) : (
                <SelectValue placeholder="Select assignee" />
              )}
            </SelectTrigger>
            <SelectContent>
              {loadingEmployees ? (
                <SelectItem value="loading" disabled>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading employees...</span>
                  </div>
                </SelectItem>
              ) : employees.length === 0 ? (
                <SelectItem value="no-employees" disabled>
                  No employees available
                </SelectItem>
              ) : (
                employees.map((employee) => (
                  <SelectItem 
                    key={employee.id} 
                    value={employee.userId ?? `no-user-${employee.id}`} 
                    disabled={!employee.userId}
                    className={cn(
                      "text-sm sm:text-base",
                      !employee.userId && "text-muted-foreground"
                    )}
                  >
                    {getEmployeeDisplayName(employee)}
                    {!employee.userId && " — no user account"}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1 sm:space-y-2">
        <Label className="text-sm sm:text-base">Due Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal border-purple-100 focus:ring-purple-500 text-sm sm:text-base",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              initialFocus
              className="rounded-md border shadow-sm"
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-purple-600 hover:bg-purple-700 mt-2 sm:mt-4 text-sm sm:text-base py-2 sm:py-2.5"
        disabled={loadingEmployees || !assignee}
      >
        Create Task
      </Button>
    </form>
  )
}