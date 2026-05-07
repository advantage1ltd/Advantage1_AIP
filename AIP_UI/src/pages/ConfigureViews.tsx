import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ViewConfigList } from "@/components/configure-views/ViewConfigList"
import { ViewConfig, ViewPermission, PageViewConfig } from "@/types/viewConfig"
import { useToast } from "@/hooks/use-toast"

const initialConfigs: PageViewConfig[] = [
  {
    pageId: "dashboard",
    pageName: "Dashboard",
    views: [
      {
        id: "incidents",
        name: "Incident Overview",
        description: "Shows recent security incidents and their status",
        enabled: true,
        permission: "all"
      },
      {
        id: "stats",
        name: "Statistics Panel",
        description: "Display key security metrics and trends",
        enabled: true,
        permission: "admin"
      }
    ]
  },
  {
    pageId: "operations",
    pageName: "Operations",
    views: [
      {
        id: "incident-reports",
        name: "Incident Reports",
        description: "Detailed reports of security incidents",
        enabled: true,
        permission: "all"
      }
    ]
  }
]

export default function ConfigureViews() {
  const { toast } = useToast()
  const [configs, setConfigs] = useState<PageViewConfig[]>(initialConfigs)

  const handlePermissionChange = (pageId: string, viewId: string, permission: ViewPermission) => {
    setConfigs(prevConfigs => 
      prevConfigs.map(config => {
        if (config.pageId === pageId) {
          return {
            ...config,
            views: config.views.map(view => 
              view.id === viewId ? { ...view, permission } : view
            )
          }
        }
        return config
      })
    )

    toast({
      title: "Permission Updated",
      description: "View permission has been successfully updated.",
    })
  }

  const handleToggleView = (pageId: string, viewId: string, enabled: boolean) => {
    setConfigs(prevConfigs => 
      prevConfigs.map(config => {
        if (config.pageId === pageId) {
          return {
            ...config,
            views: config.views.map(view => 
              view.id === viewId ? { ...view, enabled } : view
            )
          }
        }
        return config
      })
    )

    toast({
      title: enabled ? "View Enabled" : "View Disabled",
      description: `The view has been ${enabled ? 'enabled' : 'disabled'}.`,
    })
  }

  return (
    <div className="container mx-auto p-6">
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">Configure Views</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={configs[0].pageId} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-gray-800">
              {configs.map(config => (
                <TabsTrigger 
                  key={config.pageId} 
                  value={config.pageId}
                  className="data-[state=active]:bg-gray-700 text-white"
                >
                  {config.pageName}
                </TabsTrigger>
              ))}
            </TabsList>
            {configs.map(config => (
              <TabsContent key={config.pageId} value={config.pageId}>
                <ViewConfigList
                  views={config.views}
                  onPermissionChange={(viewId, permission) => 
                    handlePermissionChange(config.pageId, viewId, permission)
                  }
                  onToggleView={(viewId, enabled) => 
                    handleToggleView(config.pageId, viewId, enabled)
                  }
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}