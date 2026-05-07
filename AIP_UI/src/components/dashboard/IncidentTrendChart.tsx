import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Jan', incidents: 40 },
  { name: 'Feb', incidents: 30 },
  { name: 'Mar', incidents: 45 },
  { name: 'Apr', incidents: 25 },
  { name: 'May', incidents: 35 },
  { name: 'Jun', incidents: 20 },
]

export const IncidentTrendChart = () => {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-1 sm:pb-2 p-2 sm:p-3 md:p-4">
        <CardTitle className="text-sm sm:text-base md:text-lg text-foreground">Incident Trends</CardTitle>
      </CardHeader>
      <CardContent className="p-1 sm:p-2 md:p-4">
        <div className="h-[150px] xs:h-[180px] sm:h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}
              margin={{ 
                top: 5,
                right: 0,
                left: -10,
                bottom: 0
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="stroke-border" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground" 
                tick={{ fontSize: 8 }}
                axisLine={false}
                tickLine={false}
                tickMargin={3}
              />
              <YAxis 
                className="text-muted-foreground" 
                tick={{ fontSize: 8 }}
                width={20}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) => value.toString()}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '0.375rem',
                  fontSize: '10px',
                  padding: '4px 6px'
                }}
                labelStyle={{ fontSize: '10px', marginBottom: '2px' }}
                itemStyle={{ fontSize: '10px' }}
              />
              <Area
                type="monotone"
                dataKey="incidents"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary))"
                fillOpacity={0.2}
                strokeWidth={1.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}