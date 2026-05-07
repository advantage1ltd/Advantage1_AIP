import { createSlice, PayloadAction } from '@reduxjs/toolkit'

// Types
export type QuestionType = 'multiple-choice' | 'true-false' | 'text' | 'essay' | 'multiple-answer'

export interface Question {
  id: string
  type: QuestionType
  text: string
  options?: string[]
  correctAnswer?: string | string[]
  points: number
}

export interface Quiz {
  id: string
  title: string
  description?: string
  duration: number
  totalPoints: number
  questions: Question[]
  dateCreated: Date
  createdBy: string
  status: 'draft' | 'active' | 'scheduled' | 'completed'
  scheduledDate?: Date
}

export interface Answer {
  questionId: string
  answer: string | string[]
  correct: boolean
  points: number
}

export interface QuizResult {
  id: string
  quizId: string
  quizTitle: string
  officerId: string
  officerName: string
  score: number
  totalPoints: number
  percentageScore: number
  startTime: Date
  endTime: Date
  status: 'passed' | 'failed'
  answers: Answer[]
}

interface QuizState {
  quizzes: Quiz[]
  results: QuizResult[]
}

// Sample initial state
const initialState: QuizState = {
  quizzes: [
    {
      id: '1',
      title: 'Security Protocols Assessment',
      description: 'Test on basic security protocols and procedures',
      duration: 45,
      totalPoints: 100,
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          text: 'Which security protocol is considered the most secure?',
          options: ['Protocol A', 'Protocol B', 'Protocol C', 'Protocol D'],
          correctAnswer: '2',
          points: 5
        },
        {
          id: 'q2',
          type: 'true-false',
          text: 'Security incidents must be reported within 24 hours.',
          correctAnswer: 'true',
          points: 3
        },
        {
          id: 'q3',
          type: 'essay',
          text: 'Describe the proper procedure for handling a security breach.',
          points: 10
        }
      ],
      dateCreated: new Date('2023-06-12'),
      createdBy: 'Admin User',
      status: 'active'
    },
    {
      id: '2',
      title: 'Emergency Response Procedures',
      description: 'Assessment of emergency response knowledge',
      duration: 30,
      totalPoints: 60,
      questions: [
        {
          id: 'q1',
          type: 'multiple-choice',
          text: 'What is the first step in an emergency response?',
          options: ['Call 911', 'Assess the situation', 'Evacuate the area', 'Contact supervisor'],
          correctAnswer: '1',
          points: 5
        },
        {
          id: 'q2',
          type: 'true-false',
          text: 'In case of fire, you should use elevators for evacuation.',
          correctAnswer: 'false',
          points: 3
        }
      ],
      dateCreated: new Date('2023-07-15'),
      createdBy: 'Admin User',
      status: 'active'
    }
  ],
  results: [
    {
      id: '1',
      quizId: '1',
      quizTitle: 'Security Protocols Assessment',
      officerId: 'OFF001',
      officerName: 'John Smith',
      score: 15,
      totalPoints: 18,
      percentageScore: 83.3,
      startTime: new Date('2023-06-10T09:30:00'),
      endTime: new Date('2023-06-10T10:15:00'),
      status: 'passed',
      answers: [
        {
          questionId: 'q1',
          answer: '2',
          correct: true,
          points: 5
        },
        {
          questionId: 'q2',
          answer: 'true',
          correct: true,
          points: 3
        },
        {
          questionId: 'q3',
          answer: 'In case of a security breach, I would first secure the area...',
          correct: true,
          points: 7
        }
      ]
    }
  ]
}

const quizSlice = createSlice({
  name: 'quiz',
  initialState,
  reducers: {
    // Add a new quiz
    addQuiz: (state, action: PayloadAction<Quiz>) => {
      state.quizzes.push(action.payload)
    },
    
    // Update an existing quiz
    updateQuiz: (state, action: PayloadAction<Quiz>) => {
      const index = state.quizzes.findIndex(quiz => quiz.id === action.payload.id)
      if (index !== -1) {
        state.quizzes[index] = action.payload
      }
    },
    
    // Delete a quiz
    deleteQuiz: (state, action: PayloadAction<string>) => {
      state.quizzes = state.quizzes.filter(quiz => quiz.id !== action.payload)
    },
    
    // Add a question to a quiz
    addQuestion: (state, action: PayloadAction<{quizId: string, question: Question}>) => {
      const { quizId, question } = action.payload
      const quiz = state.quizzes.find(q => q.id === quizId)
      if (quiz) {
        quiz.questions.push(question)
      }
    },
    
    // Update a question in a quiz
    updateQuestion: (state, action: PayloadAction<{quizId: string, question: Question}>) => {
      const { quizId, question } = action.payload
      const quiz = state.quizzes.find(q => q.id === quizId)
      if (quiz) {
        const index = quiz.questions.findIndex(q => q.id === question.id)
        if (index !== -1) {
          quiz.questions[index] = question
        }
      }
    },
    
    // Delete a question from a quiz
    deleteQuestion: (state, action: PayloadAction<{quizId: string, questionId: string}>) => {
      const { quizId, questionId } = action.payload
      const quiz = state.quizzes.find(q => q.id === quizId)
      if (quiz) {
        quiz.questions = quiz.questions.filter(q => q.id !== questionId)
      }
    },
    
    // Submit a quiz result
    submitQuizResult: (state, action: PayloadAction<QuizResult>) => {
      state.results.push(action.payload)
    }
  }
})

export const { 
  addQuiz, 
  updateQuiz, 
  deleteQuiz, 
  addQuestion, 
  updateQuestion, 
  deleteQuestion, 
  submitQuizResult 
} = quizSlice.actions

export default quizSlice.reducer 