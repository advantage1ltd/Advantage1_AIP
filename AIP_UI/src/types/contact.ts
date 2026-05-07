export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  position: string
  status: 'active' | 'inactive' | 'lead'
  lastContactDate: Date
  notes?: string
}

export interface ContactFormData extends Omit<Contact, 'id' | 'lastContactDate'> {
  lastContactDate: string
} 