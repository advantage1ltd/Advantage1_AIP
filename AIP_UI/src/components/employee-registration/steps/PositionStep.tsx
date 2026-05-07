import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"

interface PositionStepProps {
  onNext: () => void
  onBack: () => void
}

export function PositionStep({ onNext, onBack }: PositionStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label>Position</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox id="security-officer" />
            <Label htmlFor="security-officer">Security Officer</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="store-detective" />
            <Label htmlFor="store-detective">Store Detective</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="supervisor" />
            <Label htmlFor="supervisor">Supervisor</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="training-officer" />
            <Label htmlFor="training-officer">Training Officer</Label>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Previous Step</Button>
        <Button onClick={onNext}>Next Step</Button>
      </div>
    </div>
  )
}