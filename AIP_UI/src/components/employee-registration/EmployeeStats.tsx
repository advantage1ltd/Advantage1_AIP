import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Briefcase, Building2, CalendarCheck } from "lucide-react"
import { Employee } from "@/types/employee"

interface EmployeeStatsProps {
  employees?: Employee[]
}

export const EmployeeStats = ({ employees }: EmployeeStatsProps) => {
  // Add null checks to prevent errors when employees is undefined
  const employeesArray = employees || []
  const totalEmployees = employeesArray.length
  const activeEmployees = employeesArray.filter(emp => emp.employeeStatus === "Active").length
  const positions = new Set(employeesArray.map(emp => emp.position)).size
  const licenses = new Set(employeesArray.map(emp => emp.siaLicenceType).filter(Boolean)).size

  return (
    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
      <Card className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between p-2 md:p-3 lg:pb-2 space-y-0">
          <CardTitle className="text-xs md:text-sm font-medium text-white">Total Employees</CardTitle>
          <Users className="h-3 w-3 md:h-4 md:w-4 text-white" />
        </CardHeader>
        <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
          <div className="text-lg md:text-xl lg:text-2xl font-bold text-white">{totalEmployees}</div>
          <p className="text-[10px] md:text-xs text-slate-200">Registered employees</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-800 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between p-2 md:p-3 lg:pb-2 space-y-0">
          <CardTitle className="text-xs md:text-sm font-medium text-white">Active Employees</CardTitle>
          <CalendarCheck className="h-3 w-3 md:h-4 md:w-4 text-white" />
        </CardHeader>
        <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
          <div className="text-lg md:text-xl lg:text-2xl font-bold text-white">{activeEmployees}</div>
          <p className="text-[10px] md:text-xs text-emerald-200">Currently active</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-amber-800 via-amber-700 to-amber-800 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between p-2 md:p-3 lg:pb-2 space-y-0">
          <CardTitle className="text-xs md:text-sm font-medium text-white">Positions</CardTitle>
          <Briefcase className="h-3 w-3 md:h-4 md:w-4 text-white" />
        </CardHeader>
        <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
          <div className="text-lg md:text-xl lg:text-2xl font-bold text-white">{positions}</div>
          <p className="text-[10px] md:text-xs text-amber-200">Unique positions</p>
        </CardContent>
      </Card>
      <Card className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-800 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between p-2 md:p-3 lg:pb-2 space-y-0">
          <CardTitle className="text-xs md:text-sm font-medium text-white">License Types</CardTitle>
          <Building2 className="h-3 w-3 md:h-4 md:w-4 text-white" />
        </CardHeader>
        <CardContent className="p-2 md:p-3 pt-0 md:pt-0">
          <div className="text-lg md:text-xl lg:text-2xl font-bold text-white">{licenses}</div>
          <p className="text-[10px] md:text-xs text-blue-200">Different licenses</p>
        </CardContent>
      </Card>
    </div>
  )
}
