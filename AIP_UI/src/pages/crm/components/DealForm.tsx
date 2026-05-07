import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Deal } from "../types"

interface DealFormProps {
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  defaultValues?: Deal
}

export const DealForm = ({ onSubmit, defaultValues }: DealFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Deal Name</Label>
        <Input id="name" name="name" defaultValue={defaultValues?.name} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" defaultValue={defaultValues?.company} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="value">Value</Label>
        <Input id="value" name="value" type="number" min="0" defaultValue={defaultValues?.value} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="stage">Stage</Label>
        <Select name="stage" defaultValue={defaultValues?.stage || "lead"}>
          <SelectTrigger>
            <SelectValue placeholder="Select stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="proposal">Proposal</SelectItem>
            <SelectItem value="negotiation">Negotiation</SelectItem>
            <SelectItem value="closed-won">Closed Won</SelectItem>
            <SelectItem value="closed-lost">Closed Lost</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input id="notes" name="notes" defaultValue={defaultValues?.notes} />
      </div>
      <Button type="submit" className="w-full">
        {defaultValues ? "Update Deal" : "Add Deal"}
      </Button>
    </form>
  )
}