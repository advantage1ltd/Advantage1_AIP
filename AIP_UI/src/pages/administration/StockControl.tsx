import { useState, useMemo, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Search, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { StockItem } from "@/types/stock"
import { StockTable } from "@/components/stock/StockTable"
import { StockItemForm } from "@/components/stock/StockItemForm"
import { StockStats } from "@/components/stock/StockStats"
import { stockService } from "@/services/stockService"

const ITEMS_PER_PAGE = 10

const StockControl = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof StockItem
    direction: 'asc' | 'desc'
  }>({ key: 'name', direction: 'asc' })
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [updateTrigger, setUpdateTrigger] = useState(0)
  const [lowStockItems, setLowStockItems] = useState<StockItem[]>([])
  const [isLowStockDialogOpen, setIsLowStockDialogOpen] = useState(false)
  const { toast } = useToast()

  // Function to trigger data refresh
  const refreshData = useCallback(() => {
    setUpdateTrigger(prev => prev + 1)
  }, [])

  // Fetch stock items from API
  const fetchStockItems = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await stockService.list()
      setStockItems(data)
      console.log('✅ [StockControl] Successfully fetched stock items:', data.length)
    } catch (error) {
      console.error('❌ [StockControl] Error fetching stock items:', error)
      toast({
        title: "Error",
        description: (error as Error).message || "Failed to load stock items",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Fetch data on mount and when updateTrigger changes
  useEffect(() => {
    fetchStockItems()
  }, [fetchStockItems, updateTrigger])

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredItems = useMemo(() => {
    return stockItems.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.issuedBy.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [stockItems, searchQuery])

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems].sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }

      return sortConfig.direction === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })
    return sorted
  }, [filteredItems, sortConfig])

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return sortedItems.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [sortedItems, currentPage])

  const totalPages = Math.ceil(sortedItems.length / ITEMS_PER_PAGE)

  const handleSort = (key: keyof StockItem) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const quantity = Number(formData.get('quantity'))
    const minimumStock = Number(formData.get('minimumStock'))
    const status = quantity === 0 ? 'Out of Stock' : quantity <= minimumStock ? 'Low Stock' : 'In Stock'

    try {
      const created = await stockService.create({
        name: formData.get('name') as string,
        quantity,
        minimumStock,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        numberAdded: Number(formData.get('numberAdded')),
        date: (formData.get('date') as string) || new Date().toISOString().slice(0,10),
        numberIssued: Number(formData.get('numberIssued')),
        issuedBy: (formData.get('issuedBy') as string) || ''
      })
      // If API does not compute status, compute client-side for display
      const normalized: StockItem = { ...created, status }
      setStockItems([...stockItems, normalized])
      setIsAddDialogOpen(false)
      refreshData()
      toast({ title: 'Success', description: 'New item has been added to inventory' })
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    }
  }

  const handleEditItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedItem) return

    const formData = new FormData(e.currentTarget)
    const quantity = Number(formData.get('quantity'))
    const minimumStock = Number(formData.get('minimumStock'))
    
    try {
      const updated = await stockService.update(selectedItem.id, {
        name: formData.get('name') as string,
        quantity,
        minimumStock,
        category: formData.get('category') as string,
        description: formData.get('description') as string,
        numberAdded: Number(formData.get('numberAdded')),
        date: (formData.get('date') as string) || selectedItem.date,
        numberIssued: Number(formData.get('numberIssued')),
        issuedBy: (formData.get('issuedBy') as string) || selectedItem.issuedBy
      })
      const status = quantity === 0 ? 'Out of Stock' : quantity <= minimumStock ? 'Low Stock' : 'In Stock'
      const normalized: StockItem = { ...updated, status }
      setStockItems(stockItems.map(item => item.id === selectedItem.id ? normalized : item))
      setSelectedItem(null)
      refreshData()
      toast({ title: 'Success', description: 'Item has been updated' })
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    }
  }

  const handleDeleteItem = async (id: number) => {
    try {
      await stockService.remove(id)
      setStockItems(stockItems.filter(item => item.id !== id))
      refreshData()
      toast({ title: 'Success', description: 'Item has been deleted' })
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    }
  }

  const handleCheckLowStock = async () => {
    try {
      await stockService.checkLowStock()
      const lowStock = await stockService.getLowStockItems()
      setLowStockItems(lowStock)
      setIsLowStockDialogOpen(true)
      toast({ 
        title: 'Low Stock Check Complete', 
        description: `Found ${lowStock.length} items with low stock levels. Notifications sent to ops@advantage1.co.uk` 
      })
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' })
    }
  }

  return (
    <div className="w-full max-w-[100vw] overflow-x-hidden px-2 sm:px-4 md:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#303D51]">Stock Control</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button 
            variant="outline"
            onClick={handleCheckLowStock}
            className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 w-full sm:w-auto"
          >
            <AlertTriangle className="mr-2 h-4 w-4" /> Check Low Stock
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 hover:from-slate-700 hover:via-slate-600 hover:to-slate-700 text-white w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" /> Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100%-2rem)] sm:w-auto max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle>Add New Item</DialogTitle>
                <DialogDescription>
                  Add a new item to your inventory. Fill in all the required fields below.
                </DialogDescription>
              </DialogHeader>
              <StockItemForm onSubmit={handleAddItem} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <StockStats items={stockItems} />

      <Card className="shadow-lg overflow-hidden">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle>Inventory List</CardTitle>
        </CardHeader>
        <CardContent className="p-2 sm:p-4 md:p-6">
          <div className="flex gap-2 sm:gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto -mx-2 px-2">
            <StockTable 
              items={paginatedItems}
              onSort={handleSort}
              onEdit={setSelectedItem}
              onDelete={handleDeleteItem}
              onStockUpdated={refreshData}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-auto max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the item details below.
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <StockItemForm item={selectedItem} onSubmit={handleEditItem} />
          )}
        </DialogContent>
      </Dialog>

      {/* Low Stock Dialog */}
      <Dialog open={isLowStockDialogOpen} onOpenChange={setIsLowStockDialogOpen}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-auto max-w-4xl mx-auto">
          <DialogHeader>
            <DialogTitle>Low Stock Items</DialogTitle>
            <DialogDescription>
              Items with low stock levels. Notifications have been sent to ops@advantage1.co.uk
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {lowStockItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No items with low stock levels found.</p>
            ) : (
              <div className="space-y-2">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-sm text-gray-600">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        item.quantity === 0 ? 'text-red-600' : 'text-orange-600'
                      }`}>
                        {item.quantity} / {item.minimumStock}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default StockControl
