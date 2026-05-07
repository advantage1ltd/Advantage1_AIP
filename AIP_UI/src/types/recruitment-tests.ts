export type RecruitmentQuestionType =
	| 'multiple-choice'
	| 'multiple-answer'
	| 'true-false'
	| 'text'
	| 'essay'

export interface RecruitmentTestSummary {
	testId: string
	title: string
	description?: string | null
	durationMinutes: number
	totalPoints: number
	status: string
	scheduledDate?: string | null
	questionCount: number
}

export interface RecruitmentTestTakeOption {
	optionId: number
	text: string
	sortOrder: number
}

export interface RecruitmentTestTakeQuestion {
	questionId: string
	type: RecruitmentQuestionType | string
	text: string
	points: number
	sortOrder: number
	options: RecruitmentTestTakeOption[]
}

export interface RecruitmentTestTake {
	testId: string
	title: string
	description?: string | null
	durationMinutes: number
	totalPoints: number
	passThresholdPercentage: number
	questions: RecruitmentTestTakeQuestion[]
}

export interface RecruitmentAttemptStart {
	attemptId: number
	testId: string
	startedAt: string
	durationMinutes: number
}

export interface RecruitmentAttemptSummary {
	attemptId: number
	testId: string
	testTitle: string
	score: number
	totalPoints: number
	percentageScore: number
	status: string
	startedAt: string
	completedAt?: string | null
	officerId: string
	officerName: string
}

export interface RecruitmentAttemptAnswer {
	questionId: string
	questionText: string
	questionType: string
	pointsEarned: number
	isCorrect: boolean
	answerText?: string | null
	answerOptionIds?: string[] | null
}

export interface RecruitmentAttemptDetail {
	attemptId: number
	testId: string
	testTitle: string
	score: number
	totalPoints: number
	percentageScore: number
	status: string
	startedAt: string
	completedAt?: string | null
	officerId: string
	officerName: string
	answers: RecruitmentAttemptAnswer[]
}

export interface SubmitRecruitmentAnswer {
	questionId: string
	answer?: string | null
	answers?: string[] | null
}

export interface SubmitRecruitmentAttemptRequest {
	answers: SubmitRecruitmentAnswer[]
}

export interface RecruitmentAdminOption {
	optionId?: number | null
	text: string
	sortOrder: number
	isCorrect: boolean
}

export interface RecruitmentAdminQuestion {
	questionId: string
	type: RecruitmentQuestionType | string
	text: string
	points: number
	sortOrder: number
	correctAnswerText?: string | null
	options: RecruitmentAdminOption[]
}

export interface RecruitmentAdminTest {
	testId: string
	title: string
	description?: string | null
	durationMinutes: number
	totalPoints: number
	passThresholdPercentage: number
	status: string
	scheduledDate?: string | null
	questions: RecruitmentAdminQuestion[]
}

export interface RecruitmentAdminAttemptSummary extends RecruitmentAttemptSummary {}

