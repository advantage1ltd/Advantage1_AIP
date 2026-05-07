import { useState, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { CustomersTable } from "@/components/customer-setup/CustomersTable"
import { RegionsTable } from "@/components/customer-setup/RegionsTable"
import { SitesTable } from "@/components/customer-setup/SitesTable"
import { CustomerStats } from "@/components/customer-setup/CustomerStats"
import { RegionDialog } from "@/components/customer-setup/RegionDialog"
import { SiteDialog } from "@/components/customer-setup/SiteDialog"
import { usePageAccess } from "@/contexts/PageAccessContext"
import type { Region, Site } from "@/types/customer"

export default function CustomerSetup() {
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("customers")
  const [regionDialogOpen, setRegionDialogOpen] = useState(false)
  const [siteDialogOpen, setSiteDialogOpen] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<Region | undefined>()
  const [selectedSite, setSelectedSite] = useState<Site | undefined>()
  const [statsUpdateTrigger, setStatsUpdateTrigger] = useState(0)
  const [regionsUpdateTrigger, setRegionsUpdateTrigger] = useState(0)
  const [sitesUpdateTrigger, setSitesUpdateTrigger] = useState(0)
  const { clearCacheAndReload } = usePageAccess()

  // Function to trigger stats update
  const updateStats = useCallback(() => {
    setStatsUpdateTrigger(prev => prev + 1)
  }, [])

  const handleCustomerSelect = useCallback((customerId: string | null) => {
    setSelectedCustomerId(customerId)
    updateStats() // Update stats when customer selection changes
  }, [updateStats])

  const handleRegionSuccess = useCallback(() => {
    // Refresh regions list
    console.log('🔧 [CustomerSetup] Region updated, refreshing list')
    setRegionsUpdateTrigger(prev => prev + 1)
    updateStats()
  }, [updateStats])

  const handleSiteSuccess = useCallback(() => {
    // Refresh sites list
    console.log('🔧 [CustomerSetup] Site updated, refreshing list')
    setSitesUpdateTrigger(prev => prev + 1)
    updateStats()
  }, [updateStats])

  const handleEditRegion = (region: Region) => {
    setSelectedRegion(region)
    setRegionDialogOpen(true)
  }

  const handleEditSite = (site: Site) => {
    setSelectedSite(site)
    setSiteDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customer Setup</h1>
      </div>

      <CustomerStats 
        selectedCustomerId={selectedCustomerId} 
        updateTrigger={statsUpdateTrigger}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="regions" disabled={!selectedCustomerId}>
            Regions
          </TabsTrigger>
          <TabsTrigger value="sites" disabled={!selectedCustomerId}>
            Sites
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <CustomersTable
            selectedCustomerId={selectedCustomerId}
            onCustomerSelect={handleCustomerSelect}
            onDataChange={updateStats}
          />
        </TabsContent>

        <TabsContent value="regions">
          {selectedCustomerId ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Regions</h2>
                <Button
                  onClick={() => {
                    setSelectedRegion(undefined)
                    setRegionDialogOpen(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Add Region
                </Button>
              </div>
              <RegionsTable 
                customerId={parseInt(selectedCustomerId) || 0}
                onEdit={handleEditRegion}
                onDataChange={handleRegionSuccess}
                updateTrigger={regionsUpdateTrigger}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Please select a customer to view regions
            </div>
          )}
        </TabsContent>

        <TabsContent value="sites">
          {selectedCustomerId ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Sites</h2>
                <Button
                  onClick={() => {
                    setSelectedSite(undefined)
                    setSiteDialogOpen(true)
                  }}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Add Site
                </Button>
              </div>
              <SitesTable 
                customerId={parseInt(selectedCustomerId) || 0}
                onEdit={handleEditSite}
                onDataChange={handleSiteSuccess}
                updateTrigger={sitesUpdateTrigger}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Please select a customer to view sites
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Region Dialog */}
      {selectedCustomerId && (
        <RegionDialog
          open={regionDialogOpen}
          onOpenChange={setRegionDialogOpen}
          region={selectedRegion}
          selectedCustomerId={selectedCustomerId}
          onSuccess={handleRegionSuccess}
        />
      )}

      {/* Site Dialog */}
      {selectedCustomerId && (
        <SiteDialog
          open={siteDialogOpen}
          onOpenChange={setSiteDialogOpen}
          site={selectedSite}
          selectedCustomerId={parseInt(selectedCustomerId) || 0}
          onSuccess={handleSiteSuccess}
        />
      )}
    </div>
  )
}