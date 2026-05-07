import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface PersonalInfoStepProps {
  onNext: () => void
}

export function PersonalInfoStep({ onNext }: PersonalInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>AIP Access Level</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select access level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="readonly">Read only User</SelectItem>
              <SelectItem value="editor">Advantage One HO Editor</SelectItem>
              <SelectItem value="manager">Advantage One HO Manager</SelectItem>
              <SelectItem value="admin">Administrator</SelectItem>
              <SelectItem value="site-manager">Customer-Site Manager</SelectItem>
              <SelectItem value="ho-manager">Customer-Head Office Manager</SelectItem>
              <SelectItem value="officer">Advantage One Officer</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Title</Label>
            <Input />
          </div>
          <div>
            <Label>Forename</Label>
            <Input />
          </div>
          <div>
            <Label>Surname</Label>
            <Input />
          </div>
        </div>

        <div>
          <Label>Start Date</Label>
          <Input type="date" />
        </div>

        <div>
          <Label>Employee Number</Label>
          <Input />
        </div>

        <div>
          <Label>Nationality</Label>
          <Input />
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>Next Step</Button>
      </div>
    </div>
  )
}