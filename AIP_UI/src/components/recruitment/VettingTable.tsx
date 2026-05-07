import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface VettingTableProps {
  onEdit: (candidate: Candidate) => void
  onDelete: (candidate: Candidate) => void
  searchTerm: string
  selectedStatus: string
}

interface Candidate {
  id: string
  officerName: string
  email: string
  phone: string
  position: string
  status: 'pending' | 'in-progress' | 'completed' | 'rejected'
  submittedDate: Date
  notes?: string
}

const sampleCandidates: Candidate[] = [
  {
    id: '1',
    officerName: 'John Smith',
    email: 'john.smith@example.com',
    phone: '07700 900123',
    position: 'Security Officer',
    status: 'in-progress',
    submittedDate: new Date('2024-02-15'),
    notes: 'References pending'
  },
  // ... add more sample data
]

export function VettingTable({ onEdit, onDelete, searchTerm, selectedStatus }: VettingTableProps) {
  const filteredCandidates = sampleCandidates.filter(candidate => {
    const matchesSearch = 
      candidate.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.position.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || candidate.status === selectedStatus

    return matchesSearch && matchesStatus
  })

  return (
    <div className="rounded-lg border bg-white/50 backdrop-blur-sm shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Officer Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Position</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Submitted Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredCandidates.map((candidate) => (
            <TableRow key={candidate.id} className="bg-white border-b hover:bg-gray-50">
              <TableCell className="px-6 py-4 font-medium text-gray-900">{candidate.officerName}</TableCell>
              <TableCell className="px-6 py-4">{candidate.email}</TableCell>
              <TableCell className="px-6 py-4">{candidate.position}</TableCell>
              <TableCell className="px-6 py-4">
                <Badge className={getStatusColor(candidate.status)}>
                  {candidate.status}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4">{format(candidate.submittedDate, 'dd/MM/yyyy')}</TableCell>
              <TableCell className="px-6 py-4 text-right">
                <div className="flex items-center gap-2 justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(candidate)}
                    className="hover:bg-gray-100 rounded-full p-2"
                  >
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(candidate)}
                    className="hover:bg-gray-100 rounded-full p-2"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'in-progress':
      return 'bg-blue-100 text-blue-800'
    case 'completed':
      return 'bg-green-100 text-green-800'
    case 'rejected':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}