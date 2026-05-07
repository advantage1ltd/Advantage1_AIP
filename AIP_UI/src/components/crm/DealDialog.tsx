import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Deal, PipelineStage, PIPELINE_STAGES } from "@/data/pipeline"

interface DealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deal?: Deal
  onSubmit: (data: Partial<Deal>) => void
}

export function DealDialog({ open, onOpenChange, deal, onSubmit }: DealDialogProps) {
  const [formData, setFormData] = useState<Partial<Deal>>(
    deal ?? {
      title: "",
      value: 0,
      company: "",
      contact: "",
      email: "",
      stage: "lead",
      priority: "medium"
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-[500px] p-0">
        <DialogHeader className="p-4 md:p-6 border-b">
          <DialogTitle className="text-base md:text-lg font-bold">{deal ? 'Edit Deal' : 'Create New Deal'}</DialogTitle>
          <DialogDescription className="text-xs md:text-sm mt-1">
            Enter the details for this sales opportunity
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4">
          <div className="space-y-3 md:space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-xs md:text-sm font-medium">Deal Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="h-8 md:h-9 text-xs md:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="value" className="text-xs md:text-sm font-medium">Value (£)</Label>
                <Input
                  id="value"
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                  className="h-8 md:h-9 text-xs md:text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="priority" className="text-xs md:text-sm font-medium">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'low' | 'medium' | 'high') => 
                    setFormData(prev => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low" className="text-xs md:text-sm">Low</SelectItem>
                    <SelectItem value="medium" className="text-xs md:text-sm">Medium</SelectItem>
                    <SelectItem value="high" className="text-xs md:text-sm">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="company" className="text-xs md:text-sm font-medium">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                className="h-8 md:h-9 text-xs md:text-sm"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact" className="text-xs md:text-sm font-medium">Contact Person</Label>
                <Input
                  id="contact"
                  value={formData.contact}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
                  className="h-8 md:h-9 text-xs md:text-sm"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs md:text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="h-8 md:h-9 text-xs md:text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stage" className="text-xs md:text-sm font-medium">Stage</Label>
              <Select
                value={formData.stage}
                onValueChange={(value: PipelineStage) => 
                  setFormData(prev => ({ ...prev, stage: value }))
                }
              >
                <SelectTrigger className="h-8 md:h-9 text-xs md:text-sm">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES.map(stage => (
                    <SelectItem key={stage.id} value={stage.id} className="text-xs md:text-sm">
                      {stage.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="h-8 md:h-9 text-xs md:text-sm px-3 md:px-4"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="h-8 md:h-9 text-xs md:text-sm px-3 md:px-4 bg-primary hover:bg-primary/90"
            >
              {deal ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
