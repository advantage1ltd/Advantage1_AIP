import { 
  TrendingUp, 
  Users, 
  Calendar, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  description: string
}

const MetricCard = ({ title, value, change, icon, description }: MetricCardProps) => {
  const isPositive = change && change > 0

  return (
    <div className="rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 border">
      <div className="flex items-center justify-between">
        <span className="p-1 sm:p-1.5 md:p-2 rounded-md sm:rounded-lg bg-muted">
          {icon}
        </span>
        {change && (
          <span className={`flex items-center text-[10px] xs:text-xs sm:text-sm ${
            isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            {isPositive ? <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" /> : <ArrowDownRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <h3 className="mt-1.5 sm:mt-2 md:mt-3 text-base sm:text-lg md:text-xl font-semibold text-foreground">{value}</h3>
      <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">{title}</p>
      <p className="mt-0.5 sm:mt-1 md:mt-2 text-[9px] xs:text-[10px] sm:text-xs text-muted-foreground hidden xs:block">{description}</p>
    </div>
  )
}

export const DashboardMetrics = () => {
  return (
    <>
      <MetricCard
        title="Total Tasks"
        value="2,420"
        change={12}
        icon={<Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary-600" />}
        description="Active tasks this month"
      />
      <MetricCard
        title="Active Users"
        value="1,210"
        change={-5}
        icon={<Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary-600" />}
        description="Users currently online"
      />
      <MetricCard
        title="Performance"
        value="98.2%"
        change={3}
        icon={<TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary-600" />}
        description="System uptime and reliability"
      />
      <MetricCard
        title="Incidents"
        value="6"
        change={-25}
        icon={<AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary-600" />}
        description="Open incidents requiring attention"
      />
    </>
  )
} 