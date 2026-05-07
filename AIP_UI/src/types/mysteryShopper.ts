export interface EvaluationScore {
  score: number
  comments?: string
}

export interface MysteryShopperEvaluation {
  id: string
  officerId: string
  officerName: string
  customerId?: number
  customerName: string
  siteId?: string
  location: string
  locationName: string
  date: string | Date
  time: string
  mysteryShopperName: string
  scores: Record<string, EvaluationScore>
  totalScore: number
  maxPossibleScore: number
  percentage: string
  createdAt: string
  updatedAt: string
  status?: 'submitted' | 'reviewed' | 'rejected'
} 