import { useState } from 'react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from 'recharts'
import { Calendar } from 'lucide-react'

interface DataPoint {
  date: string
  performance: number
  incidents: number
  tasks: number
}

const generateDummyData = (): DataPoint[] => {
  const data: DataPoint[] = []
  const today = new Date()
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      performance: 85 + Math.random() * 15,
      incidents: Math.floor(Math.random() * 10),
      tasks: 20 + Math.floor(Math.random() * 30)
    })
  }
  
  return data
}

const timeRanges = ['7 Days', '30 Days', '90 Days'] as const
type TimeRange = typeof timeRanges[number]

export const PerformanceGraph = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>('7 Days')
  const [data] = useState<DataPoint[]>(generateDummyData())

  return (
    <div className="space-y-1 sm:space-y-2 md:space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold">Performance Overview</h2>
        <div className="flex items-center gap-1 sm:gap-2">
          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500" />
          <select
            value={selectedRange}
            onChange={(e) => setSelectedRange(e.target.value as TimeRange)}
            className="bg-transparent border-0 text-[10px] xs:text-xs sm:text-sm text-gray-500 focus:ring-0 cursor-pointer"
          >
            {timeRanges.map(range => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="h-[150px] xs:h-[180px] sm:h-[220px] md:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{
              top: 5,
              right: 5,
              left: -5,
              bottom: 0,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="date" 
              stroke="#6B7280"
              fontSize={8}
              axisLine={false}
              tickLine={false}
              tickMargin={3}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={8}
              width={20}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => value.toString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '0.5rem',
                color: '#F3F4F6',
                fontSize: '10px',
                padding: '4px 8px'
              }}
              itemStyle={{ fontSize: '10px' }}
              labelStyle={{ fontSize: '10px', marginBottom: '2px' }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '8px', marginTop: '0px' }}
              iconSize={6}
              iconType="circle"
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
            />
            <Line
              type="monotone"
              dataKey="performance"
              name="Performance %"
              stroke="#3B82F6"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="incidents"
              name="Incidents"
              stroke="#EF4444"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="tasks"
              name="Tasks"
              stroke="#10B981"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-4">
        {[
          { label: 'Avg Performance', value: '94.8%', color: 'text-blue-500' },
          { label: 'Total Incidents', value: '24', color: 'text-red-500' },
          { label: 'Completed Tasks', value: '156', color: 'text-green-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1 sm:p-2 md:p-4">
            <p className="text-[8px] xs:text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">{stat.label}</p>
            <p className={`text-xs sm:text-sm md:text-lg font-semibold ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
} 