import { Users, Handshake, Building2, DollarSign, CheckSquare } from "lucide-react"
import { SidebarMenuButton } from "@/components/ui/sidebar"
import { Link } from "react-router-dom"

export const CRMSection = () => {
  return (
    <div className="pl-4 space-y-2">
      <SidebarMenuButton asChild>
        <Link to="/crm/contacts">
          <Users className="w-4 h-4" />
          <span>Contacts</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/crm/deals">
          <Handshake className="w-4 h-4" />
          <span>Deals</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/crm/pipeline">
          <Building2 className="w-4 h-4" />
          <span>Pipeline</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/crm/tasks">
          <CheckSquare className="w-4 h-4" />
          <span>Tasks</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/crm/revenue">
          <DollarSign className="w-4 h-4" />
          <span>Revenue</span>
        </Link>
      </SidebarMenuButton>
    </div>
  )
}