export interface Deal {
  id: string
  name: string
  value: number
  status: 'New' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Closed Won' | 'Closed Lost'
  company: string
  contact: string
  closeDate: string
  probability: number
  notes: string
  services: string[]
  lastActivity?: string
  nextActivity?: string
}
