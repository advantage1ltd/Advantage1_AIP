import { Building2, Mail, Phone, User, Calendar, PenLine, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Lead } from "@/types/leads"

interface LeadTableProps {
  leads: Lead[]
  onMoveToContact: (lead: Lead) => void
}

function getStatusColor(status: string) {
  switch (status) {
    case 'New Lead':
      return 'bg-yellow-100 text-yellow-600 border-yellow-200'
    case 'Qualified':
      return 'bg-purple-100 text-purple-600 border-purple-200'
    case 'Negotiation':
      return 'bg-blue-100 text-blue-600 border-blue-200'
    case 'Won':
      return 'bg-green-100 text-green-600 border-green-200'
    case 'Lost':
      return 'bg-red-100 text-red-600 border-red-200'
    default:
      return 'bg-slate-100 text-slate-600 border-slate-200'
  }
}

export function LeadTable({ leads, onMoveToContact }: LeadTableProps) {
  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-5 bg-white text-center">
        <div className="rounded-full bg-slate-100 p-2.5 mb-2.5">
          <User className="h-5 w-5 text-slate-400" />
        </div>
        <h3 className="text-xs font-medium mb-1">No leads found</h3>
        <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
          Try adjusting your search or filters
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100">
      {leads.map((lead) => (
        <div key={lead.id} className="hover:bg-slate-50/70">
          <div className="p-2.5">
            <div className="mb-1.5 flex justify-between items-start">
              <div>
                <div className="font-medium text-sm text-primary">
                  {lead.name}
                </div>
                <div className="text-xs text-muted-foreground">{lead.company}</div>
              </div>
              <Badge className={`${getStatusColor(lead.status)} text-xs px-2 py-0.5 rounded-full`}>
                {lead.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <User className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{lead.title}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{lead.lastInteraction}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Mail className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate">
                  {lead.email}
                </a>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone className="h-3 w-3 text-slate-400 flex-shrink-0" />
                <a href={`tel:${lead.phone}`} className="text-primary hover:underline truncate">
                  {lead.phone}
                </a>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => onMoveToContact(lead)}
                className="h-7 text-[11px] px-2.5 bg-primary text-white rounded-md"
              >
                Move to Contacts
              </Button>
              <div className="flex gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 w-6 p-0 rounded-full"
                >
                  <PenLine className="h-3 w-3" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-6 w-6 p-0 rounded-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
