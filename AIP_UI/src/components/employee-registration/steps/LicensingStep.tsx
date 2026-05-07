import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface LicensingStepProps {
  onNext: () => void
  onBack: () => void
}

export function LicensingStep({ onNext, onBack }: LicensingStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>SIA Licence Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select licence type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="close-protection">Close Protection</SelectItem>
              <SelectItem value="cctv">CCTV</SelectItem>
              <SelectItem value="security-guarding">Security Guarding</SelectItem>
              <SelectItem value="door-supervisor">Door Supervisor</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>SIA Licence Expiry</Label>
          <Input type="date" />
        </div>

        <div>
          <Label>Driving Licence Type</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select licence type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="european">European</SelectItem>
              <SelectItem value="full-uk">Full UK</SelectItem>
              <SelectItem value="international">International</SelectItem>
              <SelectItem value="provisional">Provisional</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Date Driving Licence</Label>
          <Input type="date" />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Previous Step</Button>
        <Button onClick={onNext}>Next Step</Button>
      </div>
    </div>
  )
}