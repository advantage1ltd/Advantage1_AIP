import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { Contact } from '@/types/contact'
import { v4 as uuidv4 } from 'uuid'

interface ContactsState {
  contacts: Contact[]
  isLoading: boolean
  error: string | null
}

const initialState: ContactsState = {
  contacts: [],
  isLoading: false,
  error: null
}

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    addContact: (state, action: PayloadAction<Omit<Contact, 'id'>>) => {
      state.contacts.push({
        ...action.payload,
        id: uuidv4()
      })
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