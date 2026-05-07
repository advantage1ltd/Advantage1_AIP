import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { siteService } from "@/services/siteService"
import type { Site } from "@/types/customer"
import { Pencil, Trash2, Search, ChevronLeft, ChevronRight, Shield, CheckCircle, XCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface SitesTableProps {
  customerId: number | null
  onEdit: (site: Site) => void
  onDataChange: () => void
  updateTrigger?: number
}

export function SitesTable({ customerId, onEdit, onDataChange, updateTrigger }: SitesTableProps) {
  const [sites, setSites] = useState<Site[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [siteToDelete, setSiteToDelete] = useState<Site | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const itemsPerPage = 10

  // Fetch sites from service
  const fetchSites = async () => {
    if (!customerId) {
      setSites([])
      return
    }
    try {
      console.log('🔧 [SitesTable] Fetching sites for customer:', customerId)
      const result = await siteService.getSitesByCustomer(customerId)
      if (result.success) {
        console.log('🔧 [SitesTable] Successfully fetched sites:', result.data.length)
        setSites(result.data)
      } else {
        console.log('🔧 [SitesTable] Failed to fetch sites')
        setSites([])
      }
    } catch (error) {
      console.log('🔧 [SitesTable] Error fetching sites:', error)
      setSites([])
    } finally {
      // noop
    }
  }

  // Fetch sites when customer changes or onDataChange is called
  useEffect(() => {
    if (customerId) {
      fetchSites()
    }
  }, [customerId, onDataChange, updateTrigger])

  // Ensure sites is always an array
  const safeSites = sites || []

  const handleDeleteClick = (site: Site) => {
    setSiteToDelete(site)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!siteToDelete) return

    setIsLoading(true)
    try {
      const result = await siteService.deleteSite(siteToDelete.siteID)
      
      if (result.success) {
        toast({
          title: "Success",
          description: "Site deleted successfully",
        })
        onDataChange() // Refresh the data
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to delete site",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setDeleteDialogOpen(false)
      setSiteToDelete(null)
    }
  }

  // Filter by search query
  const filteredSites = safeSites.filter(site => {
    const searchLower = searchQuery.toLowerCase()
    return (
      site.locationName.toLowerCase().includes(searchLower) ||
              (site.sinNumber?.toLowerCase().includes(searchLower) || false) ||
      (site.buildingName?.toLowerCase().includes(searchLower) || false) ||
      (site.town?.toLowerCase().includes(searchLower) || false) ||
      (site.county?.toLowerCase().includes(searchLower) || false) ||
      (site.postcode?.toLowerCase().includes(searchLower) || false) ||
      (site.locationType?.toLowerCase().includes(searchLower) || false)
    )
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredSites.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentSitesTable = filteredSites.slice(startIndex, endIndex)

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const getResponsiveClasses = (field: string) => {
    switch (field) {
      case 'address':
        return 'hidden md:table-cell'
      case 'telephone':
        return 'hidden lg:table-cell'
      default:
        return ''
    }
  }

  if (!customerId) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Sites</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          Please select a customer to view sites
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search sites by name, SIN number, address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {safeSites.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No sites found for this customer. Click "Add Site" to create one.
        </div>
      ) : filteredSites.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No sites match your search criteria.
        </div>
      ) : (
        <>
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Location</TableHead>
                  <TableHead>SIN Number</TableHead>
                  <TableHead className={getResponsiveClasses('address')}>Address</TableHead>
                  <TableHead className={getResponsiveClasses('telephone')}>Telephone</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSitesTable.map((site) => (
                  <TableRow key={site.siteID}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{site.locationName}</div>
                        {site.buildingName && (
                          <div className="text-sm text-gray-500">{site.buildingName}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{site.sinNumber || "No SIN Number"}</span>
                    </TableCell>
                    <TableCell className={getResponsiveClasses('address')}>
                      <div className="text-sm">
                        <div>{site.numberandStreet || "No street address"}</div>
                        <div className="text-gray-500">
                          {[site.villageOrSuburb, site.town, site.county].filter(Boolean).join(", ")}
                        </div>
                        <div className="text-gray-500">{site.postcode || "No postcode"}</div>
                      </div>
                    </TableCell>
                    <TableCell className={getResponsiveClasses('telephone')}>
                      <span className="text-sm">{site.telephoneNumber || "No telephone"}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={site.coreSiteYN ? "default" : "secondary"} className={site.coreSiteYN ? "bg-purple-600" : ""}>
                        {site.coreSiteYN ? "Core Site" : "Site"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={site.recordIsDeletedYN ? "destructive" : "default"} className={site.recordIsDeletedYN ? "bg-red-600" : "bg-green-600"}>
                        {site.recordIsDeletedYN ? "Inactive" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(site.dateCreated).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(site)}
                          disabled={site.recordIsDeletedYN}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteClick(site)}
                          className="text-red-600 hover:text-red-700"
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredSites.length)} of {filteredSites.length} sites
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Site</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{siteToDelete?.locationName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}