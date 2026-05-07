import { Link } from "react-router-dom"
import { FileText, UserPlus, UserMinus } from "lucide-react"
import { SidebarMenuButton } from "@/components/ui/sidebar"

export function RecruitmentSection() {
  return (
    <div className="pl-4 space-y-2">
      <SidebarMenuButton asChild>
        <Link to="/recruitment/cbt">
          <FileText className="w-4 h-4" />
          <span>CBT</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/recruitment/starters">
          <UserPlus className="w-4 h-4" />
          <span>Starters</span>
        </Link>
      </SidebarMenuButton>
      <SidebarMenuButton asChild>
        <Link to="/recruitment/leavers">
          <UserMinus className="w-4 h-4" />
          <span>Leavers</span>
        </Link>
      </SidebarMenuButton>
    </div>
  )
}