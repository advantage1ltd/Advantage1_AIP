import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, AlertTriangle, XCircle, CheckCircle } from "lucide-react"
import { StockItem } from "@/types/stock"

interface StockStatsProps {
  items: StockItem[]
}

export const StockStats = ({ items }: StockStatsProps) => {
  const totalItems = items.length
  const lowStock = items.filter(item => item.quantity <= item.minimumStock && item.quantity > 0).length
  const outOfStock = items.filter(item => item.quantity === 0).length
  const inStock = items.filter(item => item.quantity > item.minimumStock).length

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      <Card className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800">
        <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-3 md:p-4 pb-1 sm:pb-2 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-white">Total Items</CardTitle>
          <Package className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-white">{totalItems}</div>
          <p className="text-[10px] sm:text-xs text-slate-200">Across all categories</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-800">
        <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-3 md:p-4 pb-1 sm:pb-2 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-white">In Stock</CardTitle>
          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-white">{inStock}</div>
          <p className="text-[10px] sm:text-xs text-emerald-200">Items above threshold</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-amber-800 via-amber-700 to-amber-800">
        <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-3 md:p-4 pb-1 sm:pb-2 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-white">Low Stock</CardTitle>
          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-white">{lowStock}</div>
          <p className="text-[10px] sm:text-xs text-amber-200">Items below threshold</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-rose-800 via-rose-700 to-rose-800">
        <CardHeader className="flex flex-row items-center justify-between p-2 sm:p-3 md:p-4 pb-1 sm:pb-2 space-y-0">
          <CardTitle className="text-xs sm:text-sm font-medium text-white">Out of Stock</CardTitle>
          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
        </CardHeader>
        <CardContent className="p-2 sm:p-3 md:p-4 pt-0 sm:pt-0">
          <div className="text-xl sm:text-2xl font-bold text-white">{outOfStock}</div>
          <p className="text-[10px] sm:text-xs text-rose-200">Items need reordering</p>
        </CardContent>
      </Card>
    </div>
  )
}