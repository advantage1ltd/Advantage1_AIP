export interface Deal {
  id: string
  name: string
  value: number
  stage: "lead" | "proposal" | "negotiation" | "closed-won" | "closed-lost"
  company: string
  notes: string
}