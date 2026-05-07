import { z } from 'zod'

export const recruitmentTestSummarySchema = z
	.object({
		testId: z.string().optional(),
		TestId: z.string().optional(),
		title: z.string(),
		description: z.string().nullable().optional(),
		durationMinutes: z.number().int(),
		totalPoints: z.number().int(),
		status: z.string(),
		scheduledDate: z.string().nullable().optional(),
		questionCount: z.number().int(),
	})
	.transform((data) => ({
		...data,
		testId: (data.testId ?? data.TestId ?? '').trim(),
	}))

export const recruitmentTestTakeOptionSchema = z.object({
	optionId: z.number().int(),
	text: z.string(),
	sortOrder: z.number().int(),
})

export const recruitmentTestTakeQuestionSchema = z.object({
	questionId: z.string(),
	type: z.string(),
	text: z.string(),
	points: z.number().int(),
	sortOrder: z.number().int(),
	options: z.array(recruitmentTestTakeOptionSchema),
})

export const recruitmentTestTakeSchema = z.object({
	testId: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	durationMinutes: z.number().int(),
	totalPoints: z.number().int(),
	passThresholdPercentage: z.number().optional().default(80),
	questions: z.array(recruitmentTestTakeQuestionSchema),
})

export const recruitmentAttemptStartSchema = z.object({
	attemptId: z.number().int(),
	testId: z.string(),
	startedAt: z.string(),
	durationMinutes: z.number().int(),
})

export const submitRecruitmentAttemptRequestSchema = z.object({
	answers: z.array(z.object({
		questionId: z.string(),
		answer: z.string().nullable().optional(),
		answers: z.array(z.string()).nullable().optional(),
	})),
})

export const recruitmentAttemptSummarySchema = z.object({
	attemptId: z.number().int(),
	testId: z.string(),
	testTitle: z.string(),
	score: z.number().int(),
	totalPoints: z.number().int(),
	percentageScore: z.number(),
	status: z.string(),
	startedAt: z.string(),
	completedAt: z.string().nullable().optional(),
	officerId: z.string(),
	officerName: z.string(),
})

export const recruitmentAttemptDetailSchema = z.object({
	attemptId: z.number().int(),
	testId: z.string(),
	testTitle: z.string(),
	score: z.number().int(),
	totalPoints: z.number().int(),
	percentageScore: z.number(),
	status: z.string(),
	startedAt: z.string(),
	completedAt: z.string().nullable().optional(),
	officerId: z.string(),
	officerName: z.string(),
	answers: z.array(z.object({
		questionId: z.string(),
		questionText: z.string(),
		questionType: z.string(),
		pointsEarned: z.number().int(),
		isCorrect: z.boolean(),
		answerText: z.string().nullable().optional(),
		answerOptionIds: z.array(z.string()).nullable().optional(),
	})),
})

export const recruitmentAdminOptionSchema = z.object({
	optionId: z.number().int().nullable().optional(),
	text: z.string(),
	sortOrder: z.number().int(),
	isCorrect: z.boolean(),
})

export const recruitmentAdminQuestionSchema = z.object({
	questionId: z.string(),
	type: z.string(),
	text: z.string(),
	points: z.number().int(),
	sortOrder: z.number().int(),
	correctAnswerText: z.string().nullable().optional(),
	options: z.array(recruitmentAdminOptionSchema).optional().default([]),
})

export const recruitmentAdminTestSchema = z.object({
	testId: z.string(),
	title: z.string(),
	description: z.string().nullable().optional(),
	durationMinutes: z.number().int(),
	totalPoints: z.number().int(),
	passThresholdPercentage: z.number().optional().default(80),
	status: z.string(),
	scheduledDate: z.string().nullable().optional(),
	questions: z.array(recruitmentAdminQuestionSchema).optional().default([]),
}).transform((data) => ({
	...data,
	testId: String(data.testId ?? '').trim(),
	questions: Array.isArray(data.questions) ? data.questions : [],
}))

