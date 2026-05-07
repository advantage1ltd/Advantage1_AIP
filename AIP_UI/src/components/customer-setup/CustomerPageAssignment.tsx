import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { 
  CUSTOMER_PAGES, 
  getPagesByCategory,
  CUSTOMER_PAGE_CATEGORIES 
} from '@/config/customerPages'
import type { CustomerType, CustomerPageAssignment, CustomerPage } from '@/types/customer'
import { 
  Calendar,
  BarChart3,
  AlertTriangle,
  MessageSquare,
  Shield,
  UserCheck,
  Footprints,
  Building,
  Key,
  Users,
  Info,
  Settings,
  FileText,
  ShieldCheck,
  BarChart2
} from 'lucide-react'

interface CustomerPageAssignmentProps {
  customerType: CustomerType
  currentAssignments: Record<string, CustomerPageAssignment>
  onAssignmentsChange: (assignments: Record<string, CustomerPageAssignment>) => void
}

const iconMap = {
  Calendar,
  BarChart3,
  BarChart2,
  AlertTriangle,
  MessageSquare,
  Shield,
  ShieldCheck,
  UserCheck,
  Footprints,
  Building,
  Key,
  Users,
  Settings,
  FileText
}

export function CustomerPageAssignment({
  customerType,
  currentAssignments,
  onAssignmentsChange
}: CustomerPageAssignmentProps) {
  const [assignments, setAssignments] = useState<Record<string, CustomerPageAssignment>>(currentAssignments || {})

  useEffect(() => {
    // Sync with current assignments when they change
    console.log('🔧 [CustomerPageAssignment] Loading page assignments:', currentAssignments)
    setAssignments(currentAssignments || {})
  }, [currentAssignments])

  const handlePageToggle = (pageId: string, enabled: boolean) => {
    console.log('🔧 [CustomerPageAssignment] handlePageToggle:', { pageId, enabled, currentAssignments: assignments })
    
    const updatedAssignments = { ...assignments }
    if (enabled) {
      updatedAssignments[pageId] = {
        enabled: true,
        customized: true,
        lastModified: new Date().toISOString(),
        modifiedBy: 'admin'
      }
    } else {
      delete updatedAssignments[pageId]
    }
    
    console.log('🔧 [CustomerPageAssignment] handlePageToggle - updatedAssignments:', updatedAssignments)
    
    setAssignments(updatedAssignments)
    onAssignmentsChange(updatedAssignments)
  }

  const isPageEnabled = (pageId: string) => {
    return assignments[pageId]?.enabled || false
  }

  const clearAll = () => {
    setAssignments({})
    onAssignmentsChange({})
  }

  const selectAll = () => {
    const allAssignments: Record<string, CustomerPageAssignment> = {}
    Object.keys(CUSTOMER_PAGES).forEach(pageId => {
      allAssignments[pageId] = {
        enabled: true,
        customized: true,
        lastModified: new Date().toISOString(),
        modifiedBy: 'admin'
      }
    })
    setAssignments(allAssignments)
    onAssignmentsChange(allAssignments)
  }

  const groupedPages = Object.entries(CUSTOMER_PAGE_CATEGORIES).map(([category, title]) => ({
    category: category as CustomerPage['category'],
    title,
    pages: Object.entries(CUSTOMER_PAGES)
      .filter(([key, page]) => page.category === category)
      .map(([key, page]) => ({ key, ...page }))
  }))

  const getIcon = (iconName: string | undefined) => {
    if (!iconName || !iconMap[iconName as keyof typeof iconMap]) {
      return <Info className="h-4 w-4" />
    }
    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    return <IconComponent className="h-4 w-4" />
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Page Assignments</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={clearAll}>
              Clear All
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          Configure which pages are available for this customer. Customer needs vary - select the pages that best fit their requirements. Service type: {' '}
          <Badge variant="secondary">{customerType}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {groupedPages.map(({ category, title, pages }) => (
          <div key={category}>
            <h4 className="font-medium text-sm mb-3 text-muted-foreground uppercase tracking-wide">
              {title}
            </h4>
            <div className="grid gap-3">
              {pages.map(page => {
                const enabled = isPageEnabled(page.key)
                
                return (
                  <div
                    key={page.key}
                    className={`flex items-start space-x-3 p-3 rounded-lg border ${
                      enabled ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <Checkbox
                      id={page.key}
                      checked={enabled}
                      onCheckedChange={(checked) => 
                        handlePageToggle(page.key, checked as boolean)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {getIcon(page.icon)}
                        <label
                          htmlFor={page.key}
                          className="text-sm font-medium cursor-pointer"
                        >
                          {page.title}
                        </label>
                        {page.readOnly && (
                          <Badge variant="outline" className="text-xs">
                            Read Only
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {page.description}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            {Object.entries(CUSTOMER_PAGE_CATEGORIES).indexOf([category, title]) !== Object.entries(CUSTOMER_PAGE_CATEGORIES).length - 1 && <Separator className="mt-4" />}
          </div>
        ))}
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <Info className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Assignment Summary
            </span>
          </div>
          <div className="text-xs text-blue-700 space-y-1">
            <p>• Total pages enabled: {Object.keys(assignments).length}</p>
            <p>• Available pages: {Object.keys(CUSTOMER_PAGES).length} pages</p>
            <p>• Customer needs vary - select pages that fit their specific requirements</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 