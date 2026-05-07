import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import type { Customer } from "@/types/customer"

interface CustomerTableRowProps {
  customer: Customer
  isSelected: boolean
  onSelect: () => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

export function CustomerTableRow({ 
  customer, 
  isSelected, 
  onSelect, 
  onEdit,
  onDelete 
}: CustomerTableRowProps) {
  // Safely derive type label
  const rawType = Array.isArray((customer as any).customerType)
    ? (customer as any).customerType[0]
    : (customer as any).customerType
  const typeStr = typeof rawType === 'string' ? rawType : ''
  const typeLabel = typeStr
    ? typeStr.charAt(0).toUpperCase() + typeStr.slice(1).replace(/-/g, ' ')
    : '—'

  const companyName = (customer as any).companyName ?? 'Unnamed'
  const companyNumber = (customer as any).companyNumber ?? '—'
  const vatNumber = (customer as any).vatNumber ?? '—'
  const status = (customer as any).status === 'inactive' ? 'inactive' : 'active'

  return (
    <TableRow 
      className={`cursor-pointer text-xs md:text-sm hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-purple-50/80' : ''}`}
      onClick={onSelect}
    >
      <TableCell className="py-2 md:py-3 font-medium">{customer.id}</TableCell>
      <TableCell className="py-2 md:py-3 font-medium">{companyName}</TableCell>
      <TableCell className="py-2 md:py-3">{companyNumber}</TableCell>
      <TableCell className="py-2 md:py-3">{vatNumber}</TableCell>
      <TableCell className="py-2 md:py-3">
        <span className={`inline-flex px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium ${
          status === 'active' 
            ? 'bg-green-100 text-green-700' 
            : 'bg-red-100 text-red-700'
        }`}>
          {status === 'active' ? 'Active' : 'Inactive'}
        </span>
      </TableCell>
      <TableCell className="py-2 md:py-3">
        <span className="inline-flex px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-medium bg-blue-100 text-blue-700">
          {typeLabel}
        </span>
      </TableCell>
      <TableCell className="py-2 md:py-3 text-right">
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(customer)
            }}
            className="h-8 w-8 p-0"
          >
            <Pencil className="h-4 w-4" />
            <span className="sr-only">Edit customer</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(customer)
            }}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete customer</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
} 