import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// Sample data
const officerData = [
  { name: 'John D.', performance: 95, incidents: 12 },
  { name: 'Sarah M.', performance: 88, incidents: 8 },
  { name: 'Mike T.', performance: 92, incidents: 15 },
  { name: 'Lisa K.', performance: 97, incidents: 7 },
  { name: 'David R.', performance: 85, incidents: 10 }
]

export const OfficerPerformanceChart = () => {
  return (
    <Card className="transition-all hover:shadow-sm">
      <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-3 md:p-4">
        <CardTitle className="text-sm sm:text-base md:text-lg font-medium">Officer Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-1 sm:p-2 md:p-4">
        <div className="h-[150px] xs:h-[180px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={officerData}
              layout="vertical"
              margin={{
                top: 0,
                right: 0,
                left: -5,
                bottom: 0,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
              <XAxis 
                type="number" 
                domain={[0, 100]}
                tick={{ fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                tickMargin={2}
                tickCount={5}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                tick={{ fontSize: 8 }}
                width={40}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value.split(' ')[0]} // Show only first name for space
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.375rem',
                  fontSize: '9px',
                  padding: '4px 6px'
                }}
                labelStyle={{ fontSize: '9px', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '9px', padding: '0px' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '8px', paddingTop: '0px' }}
                iconSize={6}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
              <Bar 
                dataKey="performance" 
                name="Performance" 
                fill="#3b82f6" 
                radius={[0, 3, 3, 0]}
                barSize={8}
              />
              <Bar 
                dataKey="incidents" 
                name="Incidents" 
                fill="#10b981" 
                radius={[0, 3, 3, 0]}
                barSize={8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-1 sm:gap-2 mt-1 sm:mt-2 md:mt-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1 sm:p-2 md:p-3">
            <p className="text-[8px] xs:text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Avg. Performance</p>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-blue-600 dark:text-blue-400">
              {(officerData.reduce((acc, curr) => acc + curr.performance, 0) / officerData.length).toFixed(1)}%
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-1 sm:p-2 md:p-3">
            <p className="text-[8px] xs:text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Total Incidents</p>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-green-600 dark:text-green-400">
              {officerData.reduce((acc, curr) => acc + curr.incidents, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 