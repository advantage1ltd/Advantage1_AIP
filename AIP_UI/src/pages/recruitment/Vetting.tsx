import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { VettingTable } from "@/components/recruitment/VettingTable"
import { VettingDialog } from "@/components/recruitment/VettingDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { UserPlus, Filter, Search, ClipboardCheck, AlertCircle, Users, Plus } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const Vetting = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const { toast } = useToast()

  // Stats data with colors
  const stats = [
    {
      title: 'Total Candidates',
      value: 24,
      icon: Users,
      color: 'bg-indigo-700',
      iconBg: 'bg-indigo-600/40'
    },
    {
      title: 'In Progress',
      value: 12,
      icon: Filter,
      color: 'bg-amber-600',
      iconBg: 'bg-amber-500/40'
    },
    {
      title: 'Completed',
      value: 8,
      icon: ClipboardCheck,
      color: 'bg-emerald-700',
      iconBg: 'bg-emerald-600/40'
    },
    {
      title: 'Rejected',
      value: 4,
      icon: AlertCircle,
      color: 'bg-rose-700',
      iconBg: 'bg-rose-600/40'
    }
  ]

  const handleNewCandidate = () => {
    setSelectedCandidate(null)
    setIsDialogOpen(true)
  }

  const handleEditCandidate = (candidate: any) => {
    setSelectedCandidate(candidate)
    setIsDialogOpen(true)
  }

  const handleDeleteCandidate = (candidate: any) => {
    toast({
      title: "Candidate Deleted",
      description: `${candidate.officerName} has been removed from vetting.`
    })
  }

  return (
    <div className="min-h-screen bg-[#EFF4FF] w-full overflow-x-hidden">
      <div className="container mx-auto px-3 py-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 max-w-full md:max-w-[95%] lg:max-w-7xl">
        {/* Header Card */}
        <Card className="shadow-sm border border-border/40">
          <CardHeader className="pb-3 sm:pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-primary">Candidate Vetting</CardTitle>
                <CardDescription className="mt-1 text-xs sm:text-sm">Manage and track candidate vetting process</CardDescription>
              </div>
              <Button 
                onClick={handleNewCandidate}
                className="w-full sm:w-auto h-9 text-xs sm:text-sm"
              >
                <Plus className="h-5 w-5 mr-1 sm:mr-2" />
                <span className="sm:hidden">Add New</span>
                <span className="hidden sm:inline">Add New Candidate</span>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          {stats.map((stat) => (
            <Card 
              key={stat.title} 
              className={cn(
                "text-white hover:shadow-lg transition-shadow rounded-lg",
                stat.color 
              )}
            >
              <CardContent className="pt-3 pb-2 px-3 md:pt-4 md:pb-3 md:px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-white/80">{stat.title}</p>
                    <p className="text-lg md:text-xl lg:text-2xl font-bold mt-0 md:mt-1">{stat.value}</p>
                  </div>
                  <div className={cn("p-2 rounded-full", stat.iconBg)}>
                    <stat.icon className="h-5 w-5 md:h-6 md:w-6 lg:h-7 lg:w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content with Filters */}
        <Card className="border border-border/40 shadow-sm">
          <CardContent className="p-3 sm:p-4 md:p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search candidates..."
                  className="pl-9 h-9 sm:h-10 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm min-w-[140px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <VettingTable
              onEdit={handleEditCandidate}
              onDelete={handleDeleteCandidate}
              searchTerm={searchTerm}
              selectedStatus={selectedStatus}
            />
          </CardContent>
        </Card>

        <VettingDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) {
              setSelectedCandidate(null)
            }
          }}
          candidate={selectedCandidate}
        />
      </div>
    </div>
  )
}

export default Vetting