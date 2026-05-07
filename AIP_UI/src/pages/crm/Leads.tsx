import { useState, useMemo, useCallback } from "react"
import React from 'react'
import { Plus, ChevronDown, Users, Building, CheckCircle2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { LeadTable } from "@/components/leads/LeadTable"
import { LeadForm } from "@/components/leads/LeadForm"
import { LeadFilter } from "@/components/leads/LeadFilter"
import { Lead } from "@/types/leads"
import { Contact } from "@/types/contacts"
import { toast as hotToast, ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog"
import { v4 as uuidv4 } from 'uuid'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDispatch } from 'react-redux'
import { addContact } from '@/store/features/contactsSlice'
import { useNavigate } from 'react-router-dom'

// Types
type GroupByOption = "status" | "company" | null
// Define LeadStatus type
type LeadStatus = "New Lead" | "Qualified" | "Negotiation" | "Won" | "Lost";

type Filters = { status?: LeadStatus }
type StatCard = {
  label: string
  value: number
  icon: React.ElementType
  bgColor: string
  hoverColor: string
}

// Update LeadFilter props type at the top of the file
type LeadFilterProps = {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  className?: string // Make className optional
}

// Sample data - replace with actual data fetching
const SAMPLE_LEADS: Lead[] = [
  {
    id: "1",
    name: "Steven Scott",
    status: "New Lead",
    company: "Microsoft",
    title: "Team leader",
    email: "steven@microsoft.com",
    phone: "+1 203 795 3265",
    lastInteraction: "Nov 8, 2024",
    notes: "Initial contact made through LinkedIn"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    status: "Qualified",
    company: "Apple",
    title: "Security Manager",
    email: "sarah.j@apple.com",
    phone: "+1 408 555 0123",
    lastInteraction: "Nov 10, 2024",
    notes: "Interested in our monitoring services"
  }
]

// Components
const StatCardComponent = React.memo(({ stat, isLast, totalStats }: { 
  stat: StatCard
  isLast: boolean
  totalStats: number 
}) => {
  const Icon = stat.icon
  return (
    <Card 
      className={`${stat.bgColor} ${stat.hoverColor} transition-all duration-200 rounded-lg shadow-sm overflow-hidden`}
    >
      <div className="p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-white font-medium truncate">{stat.label}</span>
          <Icon className="h-4 w-4 text-white/80" />
        </div>
        <p className="text-xl font-bold text-white">{stat.value}</p>
      </div>
    </Card>
  )
})

const EmptyState = React.memo(({ searchQuery, filters, onAddLead }: { 
  searchQuery: string
  filters: Filters
  onAddLead: () => void 
}) => (
  <div className="flex flex-col items-center justify-center p-8 sm:p-12 bg-white rounded-lg border border-border/40 shadow-lg text-center mt-4 sm:mt-6">
    <div className="rounded-full bg-primary/10 p-4 mb-4">
      <Plus className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
    </div>
    <h3 className="text-lg sm:text-xl font-semibold mb-2">No leads found</h3>
    <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-md mx-auto">
      {searchQuery || filters.status 
        ? "Try adjusting your search or filters to find what you're looking for." 
        : "Get started by adding your first lead to begin tracking potential clients."}
    </p>
    <Button 
      className="gap-2 bg-primary hover:bg-primary/90 text-sm sm:text-base py-2 px-4"
      onClick={onAddLead}
    >
      <Plus className="h-5 w-5" />
      Add your first lead
    </Button>
  </div>
))

const LeadsHeader = React.memo(({ filters, onFilterChange, onAddLead }: {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  onAddLead: () => void
}) => (
  <div className="flex flex-col space-y-2.5">
    <div className="flex items-start">
      <div className="bg-blue-50 rounded-lg p-1.5 mr-2">
        <div className="text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-text"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
        </div>
      </div>
      <div>
        <h1 className="text-lg font-bold tracking-tight text-primary">Lead Management</h1>
        <p className="text-xs text-muted-foreground">
          Manage and track your potential clients
        </p>
      </div>
    </div>
    
    <div className="grid grid-cols-5 gap-2">
      <div className="col-span-3">
        <LeadFilter 
          filters={filters}
          onFilterChange={onFilterChange}
          className="w-full"
        />
      </div>
      <Button 
        className="col-span-2 bg-primary text-white h-9 text-xs p-0 flex items-center justify-center gap-1"
        onClick={onAddLead}
      >
        <Plus className="h-4 w-4" />
        <span className="truncate">Add New Lead</span>
      </Button>
    </div>
  </div>
))

const SearchControls = React.memo(({ 
  searchQuery, 
  onSearchChange, 
  groupBy, 
  onGroupByChange,
  filteredLeadsCount,
  filters,
  searchText
}: {
  searchQuery: string
  onSearchChange: (value: string) => void
  groupBy: GroupByOption
  onGroupByChange: (value: GroupByOption) => void
  filteredLeadsCount: number
  filters: Filters
  searchText: string
}) => (
  <div className="space-y-3">
    <Card className="shadow-md rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
          </div>
          <Input
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 sm:h-11 text-sm sm:text-base pl-10 pr-4 rounded-lg border-muted"
          />
        </div>
        <Select 
          value={groupBy || 'none'} 
          onValueChange={(value) => onGroupByChange(value === 'none' ? null : value as GroupByOption)}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-10 sm:h-11 text-sm sm:text-base rounded-lg border-muted">
            <SelectValue placeholder="Group by..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No grouping</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="company">Company</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
    
    <div className="text-sm sm:text-base text-muted-foreground px-1 flex items-center">
      <div className="h-2 w-2 rounded-full bg-primary mr-2"></div>
      Showing {filteredLeadsCount} {filteredLeadsCount === 1 ? 'lead' : 'leads'}
      {filters.status ? ` with status "${filters.status}"` : ''}
      {searchText ? ` matching "${searchText}"` : ''}
    </div>
  </div>
))

export default function Leads() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [leads, setLeads] = useState<Lead[]>(SAMPLE_LEADS)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<Filters>({})
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [groupBy, setGroupBy] = useState<GroupByOption>(null)

  // Memoized handlers
  const handleAddLead = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const newLead: Lead = {
      id: uuidv4(),
      name: formData.get("name") as string,
      company: formData.get("company") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      title: formData.get("title") as string,
      status: formData.get("status") as LeadStatus,
      notes: formData.get("notes") as string,
      lastInteraction: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }

    setLeads(prev => [newLead, ...prev])
    setIsAddLeadOpen(false)
    hotToast("Lead Added", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    })
  }, [])

  const handleMoveToContact = useCallback((lead: Lead) => {
    const newContact: Contact = {
      id: lead.id,
      name: lead.name,
      company: lead.company,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes || "",
      services: [],
      industry: "",
      region: "",
    }

    dispatch(addContact(newContact))
    setLeads(prev => prev.filter(l => l.id !== lead.id))
    
    hotToast("Lead Moved to Contacts", {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    })

    navigate('/crm/contacts')
  }, [dispatch, navigate])

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters)
  }, [])

  // Memoized computations
  const filteredLeads = useMemo(() => {
    let result = leads

    if (filters.status) {
      result = result.filter(lead => lead.status === filters.status)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(lead =>
        lead.name.toLowerCase().includes(query) ||
        lead.company.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.title.toLowerCase().includes(query)
      )
    }

    return result
  }, [leads, filters.status, searchQuery])

  const groupedLeads = useMemo(() => {
    if (!groupBy) return null
    
    return filteredLeads.reduce((groups, lead) => {
      const key = lead[groupBy]
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(lead)
      return groups
    }, {} as Record<string, Lead[]>)
  }, [filteredLeads, groupBy])

  const stats = useMemo(() => [
    { 
      label: "Total Leads", 
      value: leads.length,
      icon: Users,
      bgColor: "bg-indigo-900",
      hoverColor: "hover:bg-indigo-800"
    },
    { 
      label: "New Leads", 
      value: leads.filter(lead => lead.status === "New Lead").length,
      icon: Plus,
      bgColor: "bg-blue-900",
      hoverColor: "hover:bg-blue-800"
    },
    { 
      label: "Qualified", 
      value: leads.filter(lead => lead.status === "Qualified").length,
      icon: CheckCircle2,
      bgColor: "bg-purple-900",
      hoverColor: "hover:bg-purple-800"
    },
    { 
      label: "Companies", 
      value: new Set(leads.map(lead => lead.company)).size,
      icon: Building,
      bgColor: "bg-slate-900",
      hoverColor: "hover:bg-slate-800"
    }
  ], [leads])

  // Main component return with optimized layout for mobile
  return (
    <div className="min-h-screen bg-[#EFF4FF]">
      <div className="container mx-auto px-3 py-3 sm:py-4 max-w-full">
        <div className="space-y-3 sm:space-y-4">
          <LeadsHeader 
            filters={filters}
            onFilterChange={handleFilterChange}
            onAddLead={() => setIsAddLeadOpen(true)}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {stats.map((stat, index) => (
              <StatCardComponent 
                key={stat.label} 
                stat={stat} 
                isLast={index === stats.length - 1}
                totalStats={stats.length}
              />
            ))}
          </div>

          <div className="mt-3 sm:mt-4">
            <div className="mb-2 sm:mb-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-8 border-slate-200 rounded-md text-sm"
                />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-2.5 border-b border-slate-100 flex justify-between items-center">
                <div className="text-xs text-muted-foreground">
                  Showing {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
                </div>
                <Select 
                  value={groupBy || 'none'} 
                  onValueChange={(value) => setGroupBy(value === 'none' ? null : value as GroupByOption)}
                >
                  <SelectTrigger className="w-[130px] h-7 text-xs rounded border-slate-200">
                    <SelectValue placeholder="No grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No grouping</SelectItem>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  {groupedLeads ? (
                    <>
                      {Object.entries(groupedLeads).map(([group, leads]) => (
                        <div key={group}>
                          <div className="p-2 bg-[#EFF4FF] font-medium text-xs text-primary border-t border-b border-slate-200">
                            {group}
                          </div>
                          <LeadTable 
                            leads={leads} 
                            onMoveToContact={handleMoveToContact}
                          />
                        </div>
                      ))}
                    </>
                  ) : (
                    <LeadTable 
                      leads={filteredLeads} 
                      onMoveToContact={handleMoveToContact}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating Action Button for Mobile */}
        <div className="fixed right-3 bottom-3 z-10">
          <Button
            size="icon"
            className="h-11 w-11 rounded-full shadow-lg bg-primary text-white"
            onClick={() => setIsAddLeadOpen(true)}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </div>

        {/* Dialog */}
        <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
          <DialogContent className="sm:max-w-[425px] p-0 mx-2 sm:mx-auto rounded-lg overflow-hidden">
            <DialogHeader className="p-3 sm:p-4 bg-white border-b">
              <DialogTitle className="text-base sm:text-lg font-semibold text-primary">Add New Lead</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1">
                Add details of your new lead to start tracking.
              </DialogDescription>
            </DialogHeader>
            <div className="p-3 sm:p-4">
              <LeadForm onSubmit={handleAddLead} />
            </div>
          </DialogContent>
        </Dialog>

        {/* Contact added toast */}
        <ToastContainer position="bottom-right" hideProgressBar={false} closeOnClick pauseOnHover theme="light" />
      </div>
    </div>
  )
}
