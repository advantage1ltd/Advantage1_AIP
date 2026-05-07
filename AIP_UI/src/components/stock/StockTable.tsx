import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { StockItem } from "@/types/stock"
import { ArrowUpDown, Pencil, Trash2, Minus, Plus } from "lucide-react"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { stockService, type IssueStockRequest, type AddStockRequest } from "@/services/stockService"

interface StockTableProps {
  items: StockItem[]
  onSort: (key: keyof StockItem) => void
  onEdit: (item: StockItem) => void
  onDelete: (id: number) => void
  onStockUpdated: () => void
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export const StockTable = ({ 
  items, 
  onSort, 
  onEdit, 
  onDelete, 
  onStockUpdated,
  currentPage, 
  totalPages, 
  onPageChange 
}: StockTableProps) => {
  const [isIssueDialogOpen, setIsIssueDialogOpen] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [issueQuantity, setIssueQuantity] = useState(1)
  const [addQuantity, setAddQuantity] = useState(1)
  const [issuedBy, setIssuedBy] = useState("")
  const [addedBy, setAddedBy] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleIssueStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setIsLoading(true)
    try {
      const payload: IssueStockRequest = {
        quantityToIssue: issueQuantity,
        issuedBy: issuedBy || "System User",
        reason: "Stock issued via UI"
      }

      await stockService.issueStock(selectedItem.id, payload)
      toast({
        title: "Success",
        description: `Successfully issued ${issueQuantity} units of ${selectedItem.name}`,
      })
      setIsIssueDialogOpen(false)
      setSelectedItem(null)
      setIssueQuantity(1)
      setIssuedBy("")
      onStockUpdated()
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return

    setIsLoading(true)
    try {
      const payload: AddStockRequest = {
        quantityToAdd: addQuantity,
        addedBy: addedBy || "System User",
        reason: "Stock added via UI"
      }

      await stockService.addStock(selectedItem.id, payload)
      toast({
        title: "Success",
        description: `Successfully added ${addQuantity} units to ${selectedItem.name}`,
      })
      setIsAddDialogOpen(false)
      setSelectedItem(null)
      setAddQuantity(1)
      setAddedBy("")
      onStockUpdated()
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openIssueDialog = (item: StockItem) => {
    setSelectedItem(item)
    setIssueQuantity(1)
    setIssuedBy("")
    setIsIssueDialogOpen(true)
  }

  const openAddDialog = (item: StockItem) => {
    setSelectedItem(item)
    setAddQuantity(1)
    setAddedBy("")
    setIsAddDialogOpen(true)
  }

  return (
    <div className="space-y-4 w-full">
      <div className="rounded-md border w-full overflow-x-auto">
        <Table className="min-w-[500px]">
          <TableHeader>
            <TableRow className="bg-slate-50 hover:bg-slate-100">
              <TableHead onClick={() => onSort('name')} className="cursor-pointer font-medium text-slate-700 py-3">
                <div className="flex items-center">
                  Name
                  <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => onSort('date')} className="cursor-pointer hidden sm:table-cell font-medium text-slate-700 py-3">
                <div className="flex items-center">
                  Date
                  <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => onSort('category')} className="cursor-pointer hidden md:table-cell font-medium text-slate-700 py-3">
                <div className="flex items-center">
                  Category
                  <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => onSort('quantity')} className="cursor-pointer font-medium text-slate-700 py-3">
                <div className="flex items-center">
                  Qty
                  <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => onSort('minimumStock')} className="cursor-pointer hidden lg:table-cell font-medium text-slate-700 py-3">
                <div className="flex items-center">
                  Min Stock
                  <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => onSort('numberAdded')} className="cursor-pointer hidden md:table-cell font-medium text-slate-700 py-3">
                <div className="flex items-center">
                  Number Added
                  <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => onSort('numberIssued')} className="cursor-pointer hidden md:table-cell font-medium text-slate-700 py-3">
                <div className="flex items-center">
                  Number Issued
                  <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
              <TableHead onClick={() => onSort('issuedBy')} className="cursor-pointer hidden lg:table-cell font-medium text-slate-700 py-3">
                <div className="flex items-center">
                  Issued By
                  <ArrowUpDown className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </div>
              </TableHead>
              <TableHead className="hidden sm:table-cell font-medium text-slate-700 py-3">Status</TableHead>
              <TableHead className="font-medium text-slate-700 py-3">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50">
                <TableCell className="font-medium py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center">
                    <span className="text-slate-900">{item.name}</span>
                    <span className="text-xs text-gray-500 mt-1 sm:hidden">
                      {item.category} - {new Date(item.date).toLocaleDateString()} - +{item.numberAdded}/-{item.numberIssued} - {item.issuedBy}
                    </span>
                    <span className="sm:hidden mt-1">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status === "In Stock"
                            ? "bg-green-100 text-green-700"
                            : item.status === "Low Stock"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-slate-700 py-3">{new Date(item.date).toLocaleDateString()}</TableCell>
                <TableCell className="hidden md:table-cell text-slate-700 py-3">{item.category}</TableCell>
                <TableCell className="text-slate-700 font-medium py-3 text-center">
                  {item.quantity}
                </TableCell>
                <TableCell className="hidden lg:table-cell text-slate-700 py-3">{item.minimumStock}</TableCell>
                <TableCell className="hidden md:table-cell text-slate-700 font-medium py-3">+{item.numberAdded}</TableCell>
                <TableCell className="hidden md:table-cell text-slate-700 font-medium py-3">-{item.numberIssued}</TableCell>
                <TableCell className="hidden lg:table-cell text-slate-700 py-3">{item.issuedBy}</TableCell>
                <TableCell className="hidden sm:table-cell py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "In Stock"
                        ? "bg-green-100 text-green-700"
                        : item.status === "Low Stock"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </TableCell>
                <TableCell className="py-2 px-2 sm:py-3 sm:px-4">
                  <div className="flex items-center justify-end sm:justify-start gap-1 sm:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 rounded-md border border-green-200 bg-green-50 hover:bg-green-100 shadow-sm"
                      onClick={() => openAddDialog(item)}
                      aria-label="Add stock"
                      title="Add stock"
                    >
                      <Plus className="h-4 w-4 text-green-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 rounded-md border border-orange-200 bg-orange-50 hover:bg-orange-100 shadow-sm"
                      onClick={() => openIssueDialog(item)}
                      aria-label="Issue stock"
                      title="Issue stock"
                      disabled={item.quantity === 0}
                    >
                      <Minus className="h-4 w-4 text-orange-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 rounded-md border border-purple-200 bg-purple-50 hover:bg-purple-100 shadow-sm"
                      onClick={() => onEdit(item)}
                      aria-label="Edit item"
                      title="Edit item"
                    >
                      <Pencil className="h-4 w-4 text-purple-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      className="h-9 w-9 sm:h-8 sm:w-8 p-0 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 shadow-sm"
                      aria-label="Delete item"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                  No items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent className="flex flex-wrap justify-center gap-1 sm:gap-0">
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => onPageChange(currentPage - 1)}
                className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : ''} h-9 w-9 sm:h-10 sm:w-auto flex items-center justify-center rounded-md`}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Show first page, last page, current page, and pages around current
              let pagesToShow;
              if (totalPages <= 5) {
                pagesToShow = i + 1;
              } else if (currentPage <= 3) {
                pagesToShow = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pagesToShow = totalPages - 4 + i;
              } else {
                pagesToShow = currentPage - 2 + i;
              }
              
              return (
                <PaginationItem key={pagesToShow} className="hidden sm:inline-block">
                  <PaginationLink
                    onClick={() => onPageChange(pagesToShow)}
                    isActive={currentPage === pagesToShow}
                    className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-md"
                  >
                    {pagesToShow}
                  </PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem className="sm:hidden">
              <span className="h-9 px-3 py-2 flex items-center justify-center text-sm font-medium">{currentPage} / {totalPages}</span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext 
                onClick={() => onPageChange(currentPage + 1)}
                className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''} h-9 w-9 sm:h-10 sm:w-auto flex items-center justify-center rounded-md`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Issue Stock Dialog */}
      <Dialog open={isIssueDialogOpen} onOpenChange={setIsIssueDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-auto max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Issue Stock</DialogTitle>
            <DialogDescription>
              Issue stock from {selectedItem?.name}. Current quantity: {selectedItem?.quantity}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleIssueStock} className="space-y-4">
            <div>
              <Label htmlFor="issueQuantity">Quantity to Issue</Label>
              <Input
                id="issueQuantity"
                type="number"
                min="1"
                max={selectedItem?.quantity || 1}
                value={issueQuantity}
                onChange={(e) => setIssueQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="issuedBy">Issued By</Label>
              <Input
                id="issuedBy"
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsIssueDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Issuing..." : "Issue Stock"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Stock Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-auto max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>
              Add stock to {selectedItem?.name}. Current quantity: {selectedItem?.quantity}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div>
              <Label htmlFor="addQuantity">Quantity to Add</Label>
              <Input
                id="addQuantity"
                type="number"
                min="1"
                value={addQuantity}
                onChange={(e) => setAddQuantity(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="addedBy">Added By</Label>
              <Input
                id="addedBy"
                type="text"
                value={addedBy}
                onChange={(e) => setAddedBy(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Stock"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}