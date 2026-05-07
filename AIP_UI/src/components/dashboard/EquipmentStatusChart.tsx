import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Button } from "@/components/ui/button"
import { ChevronRight } from "lucide-react"

// Sample data
const equipmentData = [
  { name: 'Uniforms', value: 150, color: '#3b82f6' },
  { name: 'Radios', value: 75, color: '#10b981' },
  { name: 'Body Cameras', value: 100, color: '#f59e0b' },
  { name: 'Vehicles', value: 25, color: '#ef4444' }
]

export const EquipmentStatusChart = () => {
  const totalEquipment = equipmentData.reduce((acc, curr) => acc + curr.value, 0)
  
  return (
    <Card className="transition-all hover:shadow-sm">
      <CardHeader className="flex flex-col xs:flex-row items-start xs:items-center justify-between pb-1 sm:pb-2 p-2 sm:p-3 md:p-4 space-y-1 xs:space-y-0">
        <div>
          <CardTitle className="text-sm sm:text-base md:text-lg font-medium">Equipment Status</CardTitle>
          <p className="text-[10px] xs:text-xs sm:text-sm text-muted-foreground">
            Total Equipment: {totalEquipment} units
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-6 sm:h-7 md:h-8 text-[10px] xs:text-xs sm:text-sm p-0 sm:px-2">
          View Details
          <ChevronRight className="ml-0.5 sm:ml-1 md:ml-2 h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-1 sm:p-2 md:p-4">
        <div className="h-[150px] xs:h-[180px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={equipmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                innerRadius="40%"
                outerRadius="70%"
                dataKey="value"
              >
                {equipmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.375rem',
                  fontSize: '9px',
                  padding: '4px 6px'
                }}
                formatter={(value: number) => {
                  const percentage = ((value / totalEquipment) * 100).toFixed(1)
                  return [`${value} (${percentage}%)`, '']
                }}
              />
              <Legend 
                layout="horizontal" 
                verticalAlign="bottom" 
                align="center"
                wrapperStyle={{ fontSize: '8px', paddingTop: '5px' }}
                iconSize={6}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 