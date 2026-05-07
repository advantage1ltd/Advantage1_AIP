import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Calendar, Mail, Pencil, Phone, Trash2, MoreVertical } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Contact } from "@/types/contacts"
import { Badge } from "@/components/ui/badge"

interface ContactTableProps {
  contacts: Contact[]
  onEdit: (contact: Contact) => void
  onDelete: (contactId: string) => void
  onAddFollowup: (contact: Contact) => void
}

export function ContactTable({ 
  contacts, 
  onEdit, 
  onDelete, 
  onAddFollowup 
}: ContactTableProps) {
  return (
    <div className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-muted/50">
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Company</TableHead>
            <TableHead className="font-semibold">Contact Info</TableHead>
            <TableHead className="font-semibold">Services</TableHead>
            <TableHead className="font-semibold">Notes</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact) => (
            <TableRow 
              key={contact.id} 
              className="hover:bg-muted/50 transition-colors"
            >
              <TableCell className="font-medium">
                <div>
                  {contact.name}
                  <div className="text-sm text-muted-foreground">
                    {contact.industry}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {contact.company}
                  <div className="text-sm text-muted-foreground">
                    {contact.region}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <a 
                    href={`mailto:${contact.email}`} 
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {contact.email}
                  </a>
                  <a 
                    href={`tel:${contact.phone}`} 
                    className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {contact.phone}
                  </a>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {contact.services.map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell 
                className="max-w-[200px] truncate text-muted-foreground" 
                title={contact.notes}
              >
                {contact.notes}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[160px]">
                    <DropdownMenuItem onClick={() => onEdit(contact)}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onAddFollowup(contact)}>
                      <Calendar className="h-4 w-4 mr-2" />
                      Add Follow-up
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onDelete(contact.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}