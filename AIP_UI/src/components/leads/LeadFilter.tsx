import { Filter } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type LeadStatus = "New Lead" | "Qualified" | "Negotiation" | "Won" | "Lost"
type Filters = { status?: LeadStatus }

export function LeadFilter({ 
  filters, 
  onFilterChange,
  className = "" 
}: { 
  filters: Filters
  onFilterChange: (filters: Filters) => void
  className?: string
}) {
  return (
    <Select
      value={filters.status || "all"}
      onValueChange={(value) => onFilterChange({ status: value === "all" ? undefined : value as LeadStatus })}
    >
      <SelectTrigger 
        className={`h-9 text-xs rounded-md border-slate-200 bg-white shadow-sm ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-slate-400" />
          <SelectValue placeholder="All Statuses" />
        </div>
      </SelectTrigger>
      <SelectContent className="rounded-md border-slate-200 shadow-md">
        <div className="p-1.5 border-b border-slate-100">
          <h3 className="text-xs font-medium text-primary">Lead Status</h3>
        </div>
        <div className="p-1">
          <SelectItem value="all" className="rounded-md text-xs py-1">All Statuses</SelectItem>
          <SelectItem value="New Lead" className="rounded-md text-xs py-1">New Lead</SelectItem>
          <SelectItem value="Qualified" className="rounded-md text-xs py-1">Qualified</SelectItem>
          <SelectItem value="Negotiation" className="rounded-md text-xs py-1">Negotiation</SelectItem>
          <SelectItem value="Won" className="rounded-md text-xs py-1">Won</SelectItem>
          <SelectItem value="Lost" className="rounded-md text-xs py-1">Lost</SelectItem>
        </div>
      </SelectContent>
    </Select>
  )
}
