import React from 'react'
import { DashboardMetrics } from '@/components/dashboard/DashboardMetrics'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { TaskScheduler } from '@/components/dashboard/TaskScheduler'
import { PerformanceGraph } from '@/components/dashboard/PerformanceGraph'

interface DashboardPageProps {
  displayName?: string
}

const DashboardPage: React.FC<DashboardPageProps> = ({ displayName }) => {
  return (
    <>
      {/* Header */}
      <header className="flex flex-col gap-1 mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Welcome back{displayName ? `, ${displayName}` : ''}! Here's what's happening today.
        </p>
      </header>

      {/* Metrics */}
      <section className="mb-4 sm:mb-6 lg:mb-8">
        <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <DashboardMetrics />
        </div>
      </section>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 lg:gap-8 mb-4 sm:mb-6 lg:mb-8">
        {/* Left Column - Task Scheduler */}
        <section className="lg:col-span-8 space-y-4 sm:space-y-6">
          <TaskScheduler />
        </section>

        {/* Right Column - Recent Activity */}
        <aside className="lg:col-span-4 space-y-4 sm:space-y-6">
          <RecentActivity />
        </aside>
      </div>

      {/* Performance Graph */}
      <section className="mb-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-3 sm:p-4 md:p-6">
            <PerformanceGraph />
          </div>
        </div>
      </section>
    </>
  )
}

export default DashboardPage;