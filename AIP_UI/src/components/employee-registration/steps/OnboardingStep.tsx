import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface OnboardingStepProps {
  onSubmit: () => void
  onBack: () => void
}

export function OnboardingStep({ onSubmit, onBack }: OnboardingStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="driving-licence-copy" />
            <Label htmlFor="driving-licence-copy">Driving Licence Copy Taken</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="driving-licence-check" />
            <Label htmlFor="driving-licence-check">Driving Licence 6M Check</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="graydon-check" />
            <Label htmlFor="graydon-check">Graydon Check Authorised?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="oral-references" />
            <Label htmlFor="oral-references">Initial Oral References Complete?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="written-references" />
            <Label htmlFor="written-references">Written References Complete</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="quick-starter" />
            <Label htmlFor="quick-starter">Quick Starter Form Complete?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="contract-signed" />
            <Label htmlFor="contract-signed">Contract Of Employment Signed</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="photo-taken" />
            <Label htmlFor="photo-taken">Photo Taken?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="id-card" />
            <Label htmlFor="id-card">ID Card Issued?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="equipment" />
            <Label htmlFor="equipment">Equipment Issued?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="uniform" />
            <Label htmlFor="uniform">Uniform Issued?</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="next-of-kin" />
            <Label htmlFor="next-of-kin">Next Of Kin Details Complete</Label>
          </div>
        </div>

        <div>
          <Label>Working Time Directive</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="opt-out">Opt out</SelectItem>
              <SelectItem value="opt-in">Opt in</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>People Hours PIN</Label>
          <Input />
        </div>

        <div>
          <Label>First Rota Issued</Label>
          <Input type="date" />
        </div>

        <div>
          <Label>Induction Training Booked</Label>
          <Input type="date" />
        </div>

        <div>
          <Label>Induction Training Location</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="site1">Site 1</SelectItem>
              <SelectItem value="site2">Site 2</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Induction Training Trainer</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Select trainer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="said">Said Said</SelectItem>
              <SelectItem value="adam">Adam Pilcher</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Previous Step</Button>
        <Button onClick={onSubmit}>Submit</Button>
      </div>
    </div>
  )
}