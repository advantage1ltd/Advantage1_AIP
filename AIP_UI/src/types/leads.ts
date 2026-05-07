export interface Lead {
  id: string;
  name: string;
  status: 'New Lead' | 'Qualified' | 'Negotiation' | 'Won' | 'Lost';
  company: string;
  title: string;
  email: string;
  phone: string;
  lastInteraction: string;
  notes?: string;
}
