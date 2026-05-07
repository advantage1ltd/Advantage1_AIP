import { format } from "date-fns"
import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MoreHorizontal, FileEdit, Trash2, Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Incident } from "@/types/incidents"

type SortField = "customerName" | "siteName" | "officerName" | "dateOfIncident" | "totalValueRecovered"
type SortOrder = "asc" | "desc"

interface IncidentsTableProps {
  incidents: Incident[]
  onEdit?: (incident: Incident) => void
  onDelete?: (incident: Incident) => void
}

export function IncidentsTable({ incidents, onEdit, onDelete }: IncidentsTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("dateOfIncident")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  // Filter incidents based on search term
  const filteredIncidents = useMemo(() => {
    const searchString = searchTerm.toLowerCase()
    return incidents.filter((incident) => {
      return (
        incident.customerName.toLowerCase().includes(searchString) ||
        incident.siteName.toLowerCase().includes(searchString) ||
        incident.officerName.toLowerCase().includes(searchString) ||
        incident.dateOfIncident.includes(searchString) ||
        incident.totalValueRecovered.toString().includes(searchString)
      )
    })
  }, [incidents, searchTerm])

  // Sort incidents
  const sortedIncidents = useMemo(() => {
    return [...filteredIncidents].sort((a, b) => {
      let compareResult = 0
      
      switch (sortField) {
        case "customerName":
        case "siteName":
        case "officerName":
          compareResult = a[sortField].localeCompare(b[sortField])
          break
        case "dateOfIncident":
          compareResult = new Date(a.dateOfIncident).getTime() - new Date(b.dateOfIncident).getTime()
          break
        case "totalValueRecovered":
          compareResult = a.totalValueRecovered - b.totalValueRecovered
          break
      }

      return sortOrder === "asc" ? compareResult : -compareResult
    })
  }, [filteredIncidents, sortField, sortOrder])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortOrder === "asc" ? 
      <ArrowUp className="ml-2 h-4 w-4" /> : 
      <ArrowDown className="ml-2 h-4 w-4" />
  }

  const SortableTableHead = ({ field, children }: { field: SortField, children: React.ReactNode }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => toggleSort(field)}
        className="h-8 p-0 font-medium flex items-center hover:text-accent-foreground"
      >
        {children}
        <SortIcon field={field} />
      </Button>
    </TableHead>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead field="customerName">Customer Name</SortableTableHead>
              <SortableTableHead field="siteName">Store Name</SortableTableHead>
              <SortableTableHead field="officerName">Officer Name</SortableTableHead>
              <SortableTableHead field="dateOfIncident">Incident Date</SortableTableHead>
              <SortableTableHead field="totalValueRecovered">Total Amount</SortableTableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedIncidents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No incidents found.
                </TableCell>
              </TableRow>
            ) : (
              sortedIncidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell>{incident.customerName}</TableCell>
                  <TableCell>{incident.siteName}</TableCell>
                  <TableCell>{incident.officerName}</TableCell>
                  <TableCell>
                    {format(new Date(incident.dateOfIncident), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    £{incident.totalValueRecovered.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {onEdit && (
                          <DropdownMenuItem onClick={() => onEdit(incident)}>
                            <FileEdit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        )}
                        {onDelete && (
                          <DropdownMenuItem
                            onClick={() => onDelete(incident)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
