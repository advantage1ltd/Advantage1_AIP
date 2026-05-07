import { TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function CustomerTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="text-xs md:text-sm font-medium py-2 md:py-3">Company Name</TableHead>
        <TableHead className="text-xs md:text-sm font-medium py-2 md:py-3 hidden sm:table-cell">Contact</TableHead>
        <TableHead className="text-xs md:text-sm font-medium py-2 md:py-3 hidden md:table-cell">Location</TableHead>
        <TableHead className="text-xs md:text-sm font-medium py-2 md:py-3">Status</TableHead>
        <TableHead className="text-xs md:text-sm font-medium py-2 md:py-3 text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
  )
}