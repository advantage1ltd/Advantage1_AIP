import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Lock } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { CUSTOMER_PAGES } from "@/config/customerPages"
import type { CustomerType, CustomerViewConfig as CustomerViewConfigType } from "@/types/customer"

interface CustomerViewConfigProps {
  customerId: number
  customerType?: CustomerType
  initialConfig?: CustomerViewConfigType
}

export function CustomerViewConfig({ customerType = 'retail', initialConfig }: CustomerViewConfigProps) {
  const { user } = useAuth()
  const enabledPages = initialConfig?.enabledPages ?? []

  const resolvedPages = useMemo(() => {
    return enabledPages
      .map(pageId => CUSTOMER_PAGES[pageId])
      .filter(Boolean)
  }, [enabledPages])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Lock className="h-4 w-4" />
        <AlertTitle>Page assignments now managed centrally</AlertTitle>
        <AlertDescription>
          Use the&nbsp;
          <Link to="/administration/customer-page-settings" className="underline">
            Customer Page Settings
          </Link>
          &nbsp;area to assign or remove pages for this customer. The summary below reflects the current view configuration.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Currently enabled pages for this customer</p>
          <p className="text-xs text-muted-foreground">Customer type: {customerType}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/administration/customer-page-settings">
            Open Customer Page Settings
          </Link>
        </Button>
      </div>

      {resolvedPages.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {resolvedPages.map(page => (
            <Card key={page.id} className="p-4">
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium">{page.title}</h4>
                    <p className="text-xs text-muted-foreground">{page.description}</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Enabled
                  </Badge>
                </div>
                {page.readOnly && (
                  <Badge variant="outline" className="text-xs">
                    Read Only
                  </Badge>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No custom view configuration found for this customer. Use Customer Page Settings to assign pages.
        </div>
      )}
    </div>
  )
} 