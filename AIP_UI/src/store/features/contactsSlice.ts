import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Contact } from '@/types/contacts'

interface ContactsState {
  contacts: Contact[]
}

const initialContacts: Contact[] = [
  {
    id: "1",
    name: "John Smith",
    company: "Tech Solutions Ltd",
    email: "john.smith@techsolutions.com",
    phone: "020 7123 4567",
    notes: "Met at Tech Conference 2024. Interested in security services.",
    industry: "Technology",
    region: "Greater London",
    createDate: "2024-01-15",
    services: ["Security Guards", "CCTV Monitoring"]
  },
  {
    id: "2",
    name: "Sarah Wilson",
    company: "Retail Group PLC",
    email: "s.wilson@retailgroup.com",
    phone: "0121 456 7890",
    notes: "Current client - Monthly review scheduled.",
    industry: "Retail",
    region: "West Midlands",
    createDate: "2024-02-01",
    services: ["Mobile Patrols", "Key Holding"]
  },
  {
    id: "3",
    name: "David Brown",
    company: "Healthcare Direct",
    email: "david.b@healthcaredirect.com",
    phone: "0161 789 0123",
    notes: "Potential client for medical facility security.",
    industry: "Healthcare",
    region: "Greater Manchester",
    createDate: "2024-02-15",
    services: ["Security Guards", "Access Control"]
  }
]

const initialState: ContactsState = {
  contacts: initialContacts
}

export const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    addContact: (state, action: PayloadAction<Contact>) => {
      state.contacts.unshift(action.payload)
    },
    updateContact: (state, action: PayloadAction<Contact>) => {
      const index = state.contacts.findIndex(contact => contact.id === action.payload.id)
      if (index !== -1) {
        state.contacts[index] = action.payload
      }
    },
    deleteContact: (state, action: PayloadAction<string>) => {
      state.contacts = state.contacts.filter(contact => contact.id !== action.payload)
    },
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = action.payload
    }
  }
})

export const { addContact, updateContact, deleteContact, setContacts } = contactsSlice.actions

export default contactsSlice.reducer
