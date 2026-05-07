import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"

interface IncidentReport {
  id: string
  customerName: string
  store: string
  officerName: string
  date: string
  amount: number
  incidentType: string
}

interface IncidentTableProps {
  data: IncidentReport[]
}

export function IncidentTable({ data }: IncidentTableProps) {
  return (
    <div className="relative w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-900 border-b-0">
            <TableHead className="text-white font-semibold">Customer Name</TableHead>
            <TableHead className="text-white font-semibold">Store Name</TableHead>
            <TableHead className="text-white font-semibold">Officer Name</TableHead>
            <TableHead className="text-white font-semibold">Incident Date</TableHead>
            <TableHead className="text-white font-semibold">Total Amount</TableHead>
            <TableHead className="text-white font-semibold">Incident Type</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((report) => (
            <TableRow key={report.id}>
              <TableCell className="font-medium">{report.customerName}</TableCell>
              <TableCell className="font-medium">{report.store}</TableCell>
              <TableCell>{report.officerName}</TableCell>
              <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
              <TableCell>£{report.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}</TableCell>
              <TableCell>{report.incidentType}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
