import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface AddressStepProps {
  onNext: () => void
  onBack: () => void
}

export function AddressStep({ onNext, onBack }: AddressStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label>House Name</Label>
          <Input />
        </div>

        <div>
          <Label>Number And Street</Label>
          <Input />
        </div>

        <div>
          <Label>Village Or Suburb</Label>
          <Input />
        </div>

        <div>
          <Label>Town</Label>
          <Input />
        </div>

        <div>
          <Label>County</Label>
          <Input />
        </div>

        <div>
          <Label>Post Code</Label>
          <Input />
        </div>

        <div>
          <Label>Region</Label>
          <Input />
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Previous Step</Button>
        <Button onClick={onNext}>Next Step</Button>
      </div>
    </div>
  )
}