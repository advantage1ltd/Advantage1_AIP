import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { Deal } from "../types"

interface DealCardProps {
  deal: Deal
  onEdit: (deal: Deal) => void
  onDelete: (dealId: string) => void
  onAddFollowup: (deal: Deal) => void
  getStageColor: (stage: Deal["stage"]) => string
}

export const DealCard = ({ deal, onEdit, onDelete, onAddFollowup, getStageColor }: DealCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{deal.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Company: {deal.company}</p>
          <p className="text-sm text-muted-foreground">Value: £{deal.value.toLocaleString()}</p>
          <p className="text-sm">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(deal.stage)}`}>
              {deal.stage.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
          </p>
          {deal.notes && (
            <p className="text-sm text-muted-foreground">Notes: {deal.notes}</p>
          )}
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={() => onAddFollowup(deal)}
            >
              <Calendar className="h-4 w-4" />
              Add Follow-up
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onEdit(deal)}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onDelete(deal.id)}
            >
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}