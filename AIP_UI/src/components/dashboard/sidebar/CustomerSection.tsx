import {
  LayoutGrid,
  MessageSquare,
  Calendar,
  FileText,
} from "lucide-react"
import { SidebarMenuButton } from "@/components/ui/sidebar"

export function CustomerSection() {
  return (
    <div className="pl-4 space-y-2">
      <SidebarMenuButton>
        <LayoutGrid className="w-4 h-4" />
        <span>Customer Dashboard</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <MessageSquare className="w-4 h-4" />
        <span>Customer Satisfaction</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <Calendar className="w-4 h-4" />
        <span>Customer Diary</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>Central England DAR</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>Mid Counties DAR</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>HOE DAR</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>Midcounties Graph</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>CEC Graphs</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>HOE Graphs</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>AAH Graphs</span>
      </SidebarMenuButton>
    </div>
  )
}