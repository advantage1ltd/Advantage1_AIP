import {
  ClipboardList,
  FileText,
} from "lucide-react"
import { SidebarMenuButton } from "@/components/ui/sidebar"

export function ControlRoomSection() {
  return (
    <div className="pl-4 space-y-2">
      <SidebarMenuButton>
        <ClipboardList className="w-4 h-4" />
        <span>Control Room Log</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>Control Room Report</span>
      </SidebarMenuButton>
      <SidebarMenuButton>
        <FileText className="w-4 h-4" />
        <span>Alarm Activation Report</span>
      </SidebarMenuButton>
    </div>
  )
}