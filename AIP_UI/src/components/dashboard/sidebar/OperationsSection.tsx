import { Link } from "react-router-dom"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { Clipboard, MapPinned, Calendar, MessageSquareMore, FileText, Users } from "lucide-react"

export const OperationsSection = () => {
  return (
    <div className="pl-4 space-y-2">
      <SidebarMenuButton asChild>
        <Link to="/operations/incident-report">
          <Clipboard className="w-4 h-4" />
          <span>Incident Report</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/operations/mystery-shopper">
          <Clipboard className="w-4 h-4" />
          <span>Mystery Shopper</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/operations/site-visit">
          <MapPinned className="w-4 h-4" />
          <span>Site Visit</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/operations/holiday-requests">
          <Calendar className="w-4 h-4" />
          <span>Holiday Request</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/operations/bank-holiday">
          <Calendar className="w-4 h-4" />
          <span>Bank Holiday</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/operations/customer-satisfaction">
          <MessageSquareMore className="w-4 h-4" />
          <span>Customer Satisfaction</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/operations/safe-duress-words">
          <FileText className="w-4 h-4" />
          <span>Safe and Duress Words</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/operations/officer-support">
          <Users className="w-4 h-4" />
          <span>Officer Support</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/operations/officer-expenses">
          <FileText className="w-4 h-4" />
          <span>Officer Expenses</span>
        </Link>
      </SidebarMenuButton>
    </div>
  )
}