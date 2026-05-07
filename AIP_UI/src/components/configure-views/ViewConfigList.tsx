import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ViewConfig, ViewPermission } from "@/types/viewConfig"

interface ViewConfigListProps {
  views: ViewConfig[]
  onPermissionChange: (viewId: string, permission: ViewPermission) => void
  onToggleView: (viewId: string, enabled: boolean) => void
}

export function ViewConfigList({ views, onPermissionChange, onToggleView }: ViewConfigListProps) {
  return (
    <div className="space-y-4">
      {views.map(view => (
        <div key={view.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800">
          <div className="space-y-1">
            <h3 className="font-medium text-white">{view.name}</h3>
            <p className="text-sm text-gray-400">{view.description}</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select
              value={view.permission}
              onValueChange={(value: ViewPermission) => onPermissionChange(view.id, value)}
            >
              <SelectTrigger className="w-[140px] bg-gray-700 text-white border-gray-600">
                <SelectValue placeholder="Select permission" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="admin">Admin Only</SelectItem>
                <SelectItem value="manager">Managers</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Switch
                checked={view.enabled}
                onCheckedChange={(checked) => onToggleView(view.id, checked)}
              />
              <span className="text-sm text-gray-400">
                {view.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}