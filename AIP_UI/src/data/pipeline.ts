export type PipelineStage = "lead" | "contact" | "proposal" | "negotiation" | "closed"

export interface Deal {
  id: string
  title: string
  value: number
  company: string
  contact: string
  email: string
  stage: PipelineStage
  priority: "low" | "medium" | "high"
  createdAt: string
  updatedAt: string
}

export const PIPELINE_STAGES = [
  { id: "lead", label: "Lead" },
  { id: "contact", label: "Contact Made" },
  { id: "proposal", label: "Proposal" },
  { id: "negotiation", label: "Negotiation" },
  { id: "closed", label: "Closed Won" }
] as const

export const DUMMY_DEALS: Deal[] = [
  {
    id: "d1",
    title: "Security System Upgrade",
    value: 20000,
    company: "TechSafe UK Ltd",
    contact: "John Smith",
    email: "john@techsafe.co.uk",
    stage: "lead",
    priority: "high",
    createdAt: "2025-01-25T10:00:00Z",
    updatedAt: "2025-01-25T10:00:00Z"
  },
  {
    id: "d2",
    title: "Access Control Implementation",
    value: 12000,
    company: "Retail Solutions UK",
    contact: "Sarah Johnson",
    email: "sarah@retailsolutions.co.uk",
    stage: "contact",
    priority: "medium",
    createdAt: "2025-01-24T15:30:00Z",
    updatedAt: "2025-01-24T15:30:00Z"
  },
  {
    id: "d3",
    title: "CCTV Installation",
    value: 6500,
    company: "SmartOffice UK Ltd",
    contact: "Mike Wilson",
    email: "mike@smartoffice.co.uk",
    stage: "proposal",
    priority: "low",
    createdAt: "2025-01-23T09:15:00Z",
    updatedAt: "2025-01-23T09:15:00Z"
  },
  {
    id: "d4",
    title: "Guard Service Contract",
    value: 35000,
    company: "Finance Plus UK",
    contact: "Emma Davis",
    email: "emma@financeplus.co.uk",
    stage: "negotiation",
    priority: "high",
    createdAt: "2025-01-22T14:20:00Z",
    updatedAt: "2025-01-22T14:20:00Z"
  },
  {
    id: "d5",
    title: "Security Consultation",
    value: 4000,
    company: "NHS Healthcare Trust",
    contact: "David Brown",
    email: "david.brown@nhs.net",
    stage: "closed",
    priority: "medium",
    createdAt: "2025-01-21T11:45:00Z",
    updatedAt: "2025-01-21T11:45:00Z"
  }
]
