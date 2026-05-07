import { useState, useEffect } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Building2, Mail, User, ArrowUpDown, MoreHorizontal, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Deal } from "@/data/pipeline"
import { formatDistanceToNow } from "date-fns"

interface DealsTableProps {
  data: Deal[]
  onEdit: (deal: Deal) => void
  onDelete: (deal: Deal) => void
  onView: (deal: Deal) => void
}

export function DealsTable({ data, onEdit, onDelete, onView }: DealsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    select: true,
    title: true,
    value: true,
    company: false,
    contact: false,
    email: false,
    stage: true,
    priority: true,
    updatedAt: false,
    actions: true,
  })
  const [rowSelection, setRowSelection] = useState({})

  // Responsive column visibility based on screen size
  useEffect(() => {
    function updateColumnVisibility() {
      const width = window.innerWidth
      
      if (width < 640) {  // Mobile
        setColumnVisibility({
          select: false,
          title: true,
          value: true,
          company: false,
          contact: false,
          email: false,
          stage: true,
          priority: false,
          updatedAt: false,
          actions: true,
        })
      } else if (width >= 640 && width < 768) {  // Small tablets (like iPad mini)
        setColumnVisibility({
          select: true,
          title: true,
          value: true,
          company: true,
          contact: false,
          email: false,
          stage: true,
          priority: true,
          updatedAt: false,
          actions: true,
        })
      } else if (width >= 768 && width < 820) {  // Medium tablets (like iPad)
        setColumnVisibility({
          select: true,
          title: true,
          value: true,
          company: true,
          contact: true,
          email: false,
          stage: true,
          priority: true,
          updatedAt: false,
          actions: true,
        })
      } else if (width >= 820 && width < 1024) {  // Large tablets (like iPad Pro)
        setColumnVisibility({
          select: true,
          title: true,
          value: true,
          company: true,
          contact: true,
          email: false,
          stage: true,
          priority: true,
          updatedAt: true,
          actions: true,
        })
      } else {  // Desktops
        setColumnVisibility({
          select: true,
          title: true,
          value: true,
          company: true,
          contact: true,
          email: true,
          stage: true,
          priority: true,
          updatedAt: true,
          actions: true,
        })
      }
    }

    // Initialize
    updateColumnVisibility()
    
    // Update on resize
    window.addEventListener('resize', updateColumnVisibility)
    
    // Cleanup
    return () => window.removeEventListener('resize', updateColumnVisibility)
  }, [])

  const columns: ColumnDef<Deal>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
          className="h-4 w-4"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          className="h-4 w-4"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-1 sm:p-1.5 md:p-2 h-auto"
          >
            <span className="hidden sm:inline">Deal</span>
            <span className="inline sm:hidden">Deal</span>
            <ArrowUpDown className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-xs sm:text-sm line-clamp-1">{row.getValue("title")}</div>
          <div className="md:hidden text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {row.original.company}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "value",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-1 sm:p-1.5 md:p-2 h-auto"
          >
            <span className="hidden sm:inline">Value</span>
            <span className="inline sm:hidden">Val</span>
            <ArrowUpDown className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("value"))
        const formatted = new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "GBP",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(amount)
 
        return <div className="font-medium text-xs sm:text-sm">{formatted}</div>
      },
    },
    {
      accessorKey: "company",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-1 sm:p-1.5 md:p-2 h-auto"
          >
            <span className="hidden sm:inline truncate max-w-[80px]">Company</span>
            <span className="inline sm:hidden">Co.</span>
            <ArrowUpDown className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Building2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm line-clamp-1">{row.getValue("company")}</span>
        </div>
      ),
    },
    {
      accessorKey: "contact",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-1 sm:p-1.5 md:p-2 h-auto"
          >
            <span className="hidden sm:inline truncate max-w-[80px]">Contact</span>
            <span className="inline sm:hidden">Contact</span>
            <ArrowUpDown className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <User className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm line-clamp-1">{row.getValue("contact")}</span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <div className="flex items-center gap-1 sm:gap-2">
          <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm text-blue-600 line-clamp-1">{row.getValue("email")}</span>
        </div>
      ),
    },
    {
      accessorKey: "stage",
      header: "Stage",
      cell: ({ row }) => {
        const stage = row.getValue("stage") as string
        const stageColors: Record<string, string> = {
          lead: "bg-blue-100 text-blue-800",
          contact: "bg-purple-100 text-purple-800",
          proposal: "bg-yellow-100 text-yellow-800",
          negotiation: "bg-orange-100 text-orange-800",
          closed: "bg-green-100 text-green-800",
        }
        
        return (
          <Badge 
            variant="secondary" 
            className={`${stageColors[stage]} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5`}
          >
            {stage.charAt(0).toUpperCase() + stage.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      cell: ({ row }) => {
        const priority = row.getValue("priority") as string
        const priorityColors = {
          low: "bg-blue-100 text-blue-800",
          medium: "bg-yellow-100 text-yellow-800",
          high: "bg-red-100 text-red-800"
        }
        
        return (
          <Badge 
            variant="secondary" 
            className={`${priorityColors[priority]} text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5`}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </Badge>
        )
      },
    },
    {
      accessorKey: "updatedAt",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="p-1 sm:p-1.5 md:p-2 h-auto"
          >
            <span className="hidden sm:inline truncate max-w-[60px]">Updated</span>
            <span className="inline sm:hidden">Updated</span>
            <ArrowUpDown className="ml-1 h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
          <div className="text-[10px] sm:text-xs text-gray-500">
            {formatDistanceToNow(new Date(row.getValue("updatedAt")), { addSuffix: true })}
          </div>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const deal = row.original
 
        return (
          <div className="flex items-center justify-end">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => onView(deal)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="sr-only">View details</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-7 w-7 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => onView(deal)} className="text-xs">
                  View details
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit(deal)} className="text-xs">
                  Edit deal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(deal)}
                  className="text-red-600 focus:text-red-600 text-xs"
                >
                  Delete deal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="border-t border-border/40">
        <Table className="w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead 
                      key={header.id} 
                      className="py-2 px-1.5 sm:px-2 md:px-3"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-slate-50/80"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className="py-2 px-1.5 sm:px-2 md:px-3"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-sm"
                >
                  No deals found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-4 p-2 sm:p-4 border-t border-border/40">
        <div className="text-xs sm:text-sm text-gray-500 order-2 sm:order-1 text-center sm:text-left">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex justify-between sm:justify-end gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2 sm:px-3"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs px-2 sm:px-3"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
