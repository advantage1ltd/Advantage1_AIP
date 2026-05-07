import { useState } from 'react'
import { Calendar, Clock, User } from 'lucide-react'

interface Task {
  id: string
  title: string
  assignee: string
  dueDate: Date
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
}

export const TaskScheduler = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Site Inspection - Location A',
      assignee: 'John Doe',
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 2), // 2 hours from now
      priority: 'high',
      status: 'pending'
    },
    // Add more tasks...
  ])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl shadow-sm">
      <div className="p-2 sm:p-3 md:p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 xs:gap-0">
          <h2 className="text-sm sm:text-base md:text-lg font-semibold">Upcoming Tasks</h2>
          <button 
            className="px-1.5 py-0.5 sm:px-2 sm:py-1 md:px-4 md:py-2 text-[10px] xs:text-xs sm:text-sm 
              bg-primary-500 text-white rounded-md sm:rounded-lg
              hover:bg-primary-600 focus:outline-none focus:ring-2 
              focus:ring-primary-500 focus:ring-offset-2"
          >
            Add Task
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {tasks.map((task) => (
          <div 
            key={task.id} 
            className="p-2 sm:p-3 md:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
          >
            <div className="flex items-start sm:items-center justify-between flex-wrap sm:flex-nowrap gap-1 sm:gap-2">
              <h3 className="text-xs sm:text-sm md:text-base font-medium">{task.title}</h3>
              <span className={`
                px-1.5 py-0.5 rounded-full text-[10px] xs:text-xs font-medium
                ${task.priority === 'high' ? 'bg-red-100 text-red-800' :
                  task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'}
              `}>
                {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
              </span>
            </div>

            <div className="mt-1 sm:mt-2 flex flex-col xs:flex-row items-start xs:items-center gap-1 xs:gap-3 sm:gap-4 text-[10px] xs:text-xs sm:text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-1">
                <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                <span className="truncate max-w-[100px] xs:max-w-[120px] sm:max-w-none">{task.assignee}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                {new Date(task.dueDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4" />
                {new Date(task.dueDate).toLocaleDateString([], {month: 'short', day: 'numeric'})}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 