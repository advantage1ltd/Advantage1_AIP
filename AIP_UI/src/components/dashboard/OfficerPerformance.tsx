import { useState } from 'react'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { Trophy, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OfficerStats {
  id: string
  name: string
  incidents: number
  valueSaved: number
  responseRate: number
  status: 'top-performer' | 'needs-improvement' | 'non-reporter'
}

interface OfficerPerformanceProps {
  data: readonly OfficerStats[]
}

type ViewMode = 'top-performers' | 'needs-improvement' | 'non-reporters'

export function OfficerPerformance({ data }: OfficerPerformanceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('top-performers')

  const getStatusColor = (status: OfficerStats['status']) => {
    switch (status) {
      case 'top-performer':
        return 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
      case 'needs-improvement':
        return 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
      case 'non-reporter':
        return 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
    }
  }

  const getStatusText = (status: OfficerStats['status']) => {
    switch (status) {
      case 'top-performer':
        return 'Top Performer'
      case 'needs-improvement':
        return 'Needs Improvement'
      case 'non-reporter':
        return 'Non-Reporter'
    }
  }

  const filteredData = data.filter(officer => {
    if (viewMode === 'top-performers') {
      return officer.status === 'top-performer'
    } else if (viewMode === 'needs-improvement') {
      return officer.status === 'needs-improvement'
    } else {
      return officer.status === 'non-reporter'
    }
  }).sort((a, b) => {
    if (viewMode === 'top-performers') {
      // Sort by value saved (descending) for top performers
      return b.valueSaved - a.valueSaved
    } else if (viewMode === 'needs-improvement') {
      // Sort by value saved (ascending) for needs improvement
      return a.valueSaved - b.valueSaved
    } else {
      // Sort alphabetically for non-reporters
      return a.name.localeCompare(b.name)
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <Button
          variant={viewMode === 'top-performers' ? 'default' : 'outline'}
          onClick={() => setViewMode('top-performers')}
          className="flex items-center gap-2"
        >
          <Trophy className="h-4 w-4" />
          Top Performers
        </Button>
        <Button
          variant={viewMode === 'needs-improvement' ? 'default' : 'outline'}
          onClick={() => setViewMode('needs-improvement')}
          className="flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Needs Improvement
        </Button>
        <Button
          variant={viewMode === 'non-reporters' ? 'default' : 'outline'}
          onClick={() => setViewMode('non-reporters')}
          className="flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4" />
          Non-Reporters
        </Button>
      </div>

      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground md:h-12 md:px-4">
                Officer
              </th>
              <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground md:h-12 md:px-4">
                Incidents
              </th>
              <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground md:h-12 md:px-4">
                Value Saved
              </th>
              <th className="h-10 px-2 text-center align-middle font-medium text-muted-foreground md:h-12 md:px-4">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredData.map((officer) => (
              <tr key={officer.id} className="border-b transition-colors hover:bg-muted/50">
                <td className="p-2 align-middle font-medium md:p-4">
                  {officer.name}
                </td>
                <td className="p-2 align-middle text-center tabular-nums md:p-4">
                  {officer.incidents}
                </td>
                <td className="p-2 align-middle text-right font-medium tabular-nums text-green-600 dark:text-green-400 md:p-4">
                  £{officer.valueSaved.toLocaleString()}
                </td>
                <td className="p-2 align-middle text-center md:p-4">
                  <Badge className={cn("inline-flex justify-center min-w-[100px]", getStatusColor(officer.status))}>
                    {getStatusText(officer.status)}
                  </Badge>
                </td>
              </tr>
            ))}
            {filteredData.length === 0 && (
              <tr>
                <td colSpan={4} className="h-24 text-center text-muted-foreground">
                  No officers found in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-muted-foreground md:text-sm p-2 md:p-4">
        {viewMode === 'top-performers' ? (
          <p>Showing top performing officers (value saved > £999) sorted by value saved</p>
        ) : viewMode === 'needs-improvement' ? (
          <p>Showing officers needing improvement (value saved ≤ £999) sorted by value saved</p>
        ) : (
          <p>Showing non-reporters (0 incidents, £0 value saved) sorted alphabetically</p>
        )}
      </div>
    </div>
  )
}
