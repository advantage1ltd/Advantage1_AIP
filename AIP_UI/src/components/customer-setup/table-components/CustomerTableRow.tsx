import { TableCell, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Customer } from "@/types/customer"

interface CustomerTableRowProps {
  customer: Customer
  isSelected: boolean
  onSelect: (customerId: string | null) => void
  onEdit: (customer: Customer) => void
}

export function CustomerTableRow({ customer, isSelected, onSelect, onEdit }: CustomerTableRowProps) {
  return (
    <TableRow 
      key={customer.id}
      className={`cursor-pointer ${isSelected ? "bg-purple-50" : ""}`}
      onClick={() => onSelect(isSelected ? null : customer.id)}
    >
      <TableCell className="font-medium">{customer.companyName}</TableCell>
      <TableCell>{customer.companyNumber}</TableCell>
      <TableCell>{customer.vatNumber}</TableCell>
      <TableCell>
        <Badge 
          variant={customer.status === "active" ? "default" : "destructive"}
          className={`capitalize ${customer.status === "active" ? "bg-green-100 text-green-700" : ""}`}
        >
          {customer.status}
        </Badge>
      </TableCell>
      <TableCell className="capitalize">{customer.customerType.replace("-", " ")}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              onEdit(customer)
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}