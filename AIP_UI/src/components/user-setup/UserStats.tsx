import { Card, CardContent } from "@/components/ui/card"
import { Users2, ShieldCheck, Clock } from "lucide-react"
import { User } from "@/data/users"

interface UserStatsProps {
  users: User[]
}

export function UserStats({ users }: UserStatsProps) {
  // Calculate stats
  const activeUsers = users.filter(u => u.status === 'active').length
  const adminCount = users.filter(u => u.role === 'Admin').length
  const recentLogins = users.filter(u => {
    const loginDate = new Date(u.lastLogin)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= 7
  }).length

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
      {/* Total Users */}
      <Card className="bg-gradient-to-br from-blue-600 via-blue-500 to-blue-600 shadow-md">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-white/60">Total Users</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1 md:mt-2">
                {users.length}
              </h3>
              <p className="text-xs md:text-sm text-white/80 mt-1">
                {activeUsers} active
              </p>
            </div>
            <div className="bg-white/10 p-2 md:p-3 rounded-full">
              <Users2 className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Users */}
      <Card className="bg-gradient-to-br from-purple-600 via-purple-500 to-purple-600 shadow-md">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-white/60">Admin Users</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1 md:mt-2">
                {adminCount}
              </h3>
              <p className="text-xs md:text-sm text-white/80 mt-1">
                {((adminCount / users.length) * 100).toFixed(1)}% of total
              </p>
            </div>
            <div className="bg-white/10 p-2 md:p-3 rounded-full">
              <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-600 shadow-md sm:col-span-2 md:col-span-1">
        <CardContent className="p-3 md:p-4 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-white/60">Recent Logins</p>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-1 md:mt-2">
                {recentLogins}
              </h3>
              <p className="text-xs md:text-sm text-white/80 mt-1">
                Last 7 days
              </p>
            </div>
            <div className="bg-white/10 p-2 md:p-3 rounded-full">
              <Clock className="h-4 w-4 md:h-5 md:w-5 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
