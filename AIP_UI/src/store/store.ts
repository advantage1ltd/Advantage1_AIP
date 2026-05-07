import { configureStore } from '@reduxjs/toolkit'
import usersReducer from './features/users/usersSlice'
import contactsReducer from './features/contactsSlice'
import quizReducer from './features/quizSlice'
import type { Quiz, QuizResult } from './features/quizSlice'

// Define initial state types
interface ContactsState {
  contacts: any[];
  loading: boolean;
  error: null | string;
}

interface QuizState {
  quizzes: Quiz[];
  results: QuizResult[];
}

interface PreloadedState {
  contacts: ContactsState;
  quiz: QuizState;
}

const preloadedState: PreloadedState = {
  contacts: {
    contacts: [],
    loading: false,
    error: null
  },
  quiz: {
    quizzes: [],
    results: []
  }
}

const store = configureStore({
  reducer: {
    users: usersReducer,
    contacts: contactsReducer,
    quiz: quizReducer
  },
  preloadedState,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
      immutableCheck: false,
    })
})

export { store }

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
