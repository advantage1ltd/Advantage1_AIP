import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { StockItem } from '@/types/stock'
import { useEffect, useState } from 'react'
import { employeeService } from '@/services/employeeService'
import { type Employee } from '@/types/employee'

interface StockItemFormProps {
  item?: StockItem
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

const getEmployeeDisplayName = (employee: Employee) => {
  if (employee.fullName) return employee.fullName
  if (employee.firstName && employee.surname) {
    return `${employee.firstName} ${employee.surname}`
  }
  return employee.employeeNumber
}

const getIssuedByValue = (employee: Employee) =>
  employee.fullName ?? employee.employeeNumber ?? employee.id.toString()

export const StockItemForm = ({ item, onSubmit }: StockItemFormProps) => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadEmployees = async () => {
      setIsLoadingEmployees(true)
      setLoadError(null)

      try {
        const response = await employeeService.getEmployeesAsFrontendInterface({
          page: 1,
          pageSize: 1000,
          status: 'active'
        })

        setEmployees(response.employees)
      } catch (error) {
        console.error('❌ [StockItemForm] Failed to load employees', error)
        setEmployees([])
        setLoadError('Unable to load employees')
      } finally {
        setIsLoadingEmployees(false)
      }
    }

    loadEmployees()
  }, [])

  const employeePlaceholder = loadError
    ? loadError
    : isLoadingEmployees
      ? 'Loading employees...'
      : employees.length
        ? 'Select employee'
        : 'No employees available'

  return (
    <form onSubmit={onSubmit} className="space-y-3 sm:space-y-4">
      <div className="space-y-1 sm:space-y-2">
        <Label htmlFor="name" className="text-sm sm:text-base">Name</Label>
        <Input 
          id="name" 
          name="name" 
          defaultValue={item?.name} 
          required 
          className="h-8 sm:h-10 text-sm sm:text-base"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="category" className="text-sm sm:text-base">Category</Label>
          <Input 
            id="category" 
            name="category" 
            defaultValue={item?.category} 
            required 
            className="h-8 sm:h-10 text-sm sm:text-base"
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="date" className="text-sm sm:text-base">Date</Label>
          <Input 
            id="date" 
            name="date" 
            type="date"
            defaultValue={item?.date}
            required 
            className="h-8 sm:h-10 text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="issuedBy" className="text-sm sm:text-base">Issued By</Label>
          <select
            id="issuedBy"
            name="issuedBy"
            defaultValue={item?.issuedBy || ''}
            required
            disabled={isLoadingEmployees || !!loadError}
            aria-busy={isLoadingEmployees}
            aria-invalid={!!loadError}
            className="h-8 sm:h-10 text-sm sm:text-base w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="" disabled>{employeePlaceholder}</option>
            {employees.map((employee) => (
              <option key={employee.id} value={getIssuedByValue(employee)}>
                {getEmployeeDisplayName(employee)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="quantity" className="text-sm sm:text-base">Quantity</Label>
          <Input 
            id="quantity" 
            name="quantity" 
            type="number" 
            defaultValue={item?.quantity} 
            required 
            className="h-8 sm:h-10 text-sm sm:text-base"
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="minimumStock" className="text-sm sm:text-base">Min Stock</Label>
          <Input 
            id="minimumStock" 
            name="minimumStock" 
            type="number" 
            defaultValue={item?.minimumStock} 
            required 
            className="h-8 sm:h-10 text-sm sm:text-base"
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="numberAdded" className="text-sm sm:text-base">Number Added</Label>
          <Input 
            id="numberAdded" 
            name="numberAdded" 
            type="number" 
            defaultValue={item?.numberAdded} 
            required 
            className="h-8 sm:h-10 text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="numberIssued" className="text-sm sm:text-base">Number Issued</Label>
          <Input 
            id="numberIssued" 
            name="numberIssued" 
            type="number" 
            defaultValue={item?.numberIssued}
            required 
            className="h-8 sm:h-10 text-sm sm:text-base"
          />
        </div>
      </div>

      <div className="space-y-1 sm:space-y-2">
        <Label htmlFor="description" className="text-sm sm:text-base">Description</Label>
        <Textarea 
          id="description" 
          name="description" 
          defaultValue={item?.description} 
          required 
          className="min-h-[80px] text-sm sm:text-base"
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-10 sm:h-11 mt-2 sm:mt-4 text-sm sm:text-base"
      >
        {item ? 'Update Item' : 'Add Item'}
      </Button>
    </form>
  )
}