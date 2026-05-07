import { recruitmentApi } from '@/config/api'
import type { BackendApiResponse } from '@/types/backend-api'
import { getApiData, getApiErrors, getApiMessage, getApiSuccess } from '@/types/backend-api'
import type {
	RecruitmentAttemptDetail,
	RecruitmentAttemptStart,
	RecruitmentAttemptSummary,
	RecruitmentAdminTest,
	RecruitmentTestSummary,
	RecruitmentTestTake,
	SubmitRecruitmentAttemptRequest,
} from '@/types/recruitment-tests'
import {
	recruitmentAdminTestSchema,
	recruitmentAttemptDetailSchema,
	recruitmentAttemptStartSchema,
	recruitmentAttemptSummarySchema,
	recruitmentTestSummarySchema,
	recruitmentTestTakeSchema,
	submitRecruitmentAttemptRequestSchema,
} from '@/validation/recruitment-tests'

const parseOrThrow = <T>(schema: { parse: (v: unknown) => T }, value: unknown): T => schema.parse(value)

/** Extract server error message from axios error or API response */
function apiError(err: unknown, fallback: string): string {
	if (err && typeof err === 'object' && 'response' in err) {
		const data = (err as { response?: { data?: BackendApiResponse<unknown>; status?: number } }).response?.data
		if (data) {
			const msg = getApiErrors(data)[0] || getApiMessage(data)
			if (msg) return msg
		}
		const status = (err as { response?: { status?: number } }).response?.status
		if (status != null) return `HTTP ${status}: ${fallback}`
	}
	if (err instanceof Error && err.message) return err.message
	return fallback
}

export const recruitmentTestService = {
	getAvailableTests: async (): Promise<RecruitmentTestSummary[]> => {
		const res = await recruitmentApi.get<BackendApiResponse<RecruitmentTestSummary[]>>('/recruitment/tests/available')
		if (!getApiSuccess(res.data)) throw new Error(apiError(null, getApiMessage(res.data) || 'Failed to load tests'))
		const data = getApiData(res.data) ?? []
		return parseOrThrow({ parse: (v) => recruitmentTestSummarySchema.array().parse(v) }, data)
	},

	getTestForTaking: async (testId: string): Promise<RecruitmentTestTake> => {
		const res = await recruitmentApi.get<BackendApiResponse<RecruitmentTestTake>>(`/recruitment/tests/${testId}/take`)
		if (!getApiSuccess(res.data)) throw new Error(apiError(null, 'Failed to load test'))
		const data = getApiData(res.data)
		if (!data) throw new Error('No data returned')
		return parseOrThrow(recruitmentTestTakeSchema, data)
	},

	startAttempt: async (testId: string): Promise<RecruitmentAttemptStart> => {
		const res = await recruitmentApi.post<BackendApiResponse<RecruitmentAttemptStart>>(`/recruitment/tests/${testId}/attempts/start`)
		if (!getApiSuccess(res.data)) throw new Error(apiError(null, 'Failed to start attempt'))
		const data = getApiData(res.data)
		if (!data) throw new Error('No data returned')
		return parseOrThrow(recruitmentAttemptStartSchema, data)
	},

	submitAttempt: async (attemptId: number, payload: SubmitRecruitmentAttemptRequest): Promise<RecruitmentAttemptDetail> => {
		submitRecruitmentAttemptRequestSchema.parse(payload)
		const res = await recruitmentApi.post<BackendApiResponse<RecruitmentAttemptDetail>>(`/recruitment/attempts/${attemptId}/submit`, payload)
		if (!getApiSuccess(res.data)) throw new Error(apiError(null, 'Failed to submit attempt'))
		const data = getApiData(res.data)
		if (!data) throw new Error('No data returned')
		return parseOrThrow(recruitmentAttemptDetailSchema, data)
	},

	getMyAttempts: async (): Promise<RecruitmentAttemptSummary[]> => {
		const res = await recruitmentApi.get<BackendApiResponse<RecruitmentAttemptSummary[]>>('/recruitment/my/attempts')
		if (!getApiSuccess(res.data)) throw new Error(apiError(null, 'Failed to load attempts'))
		const data = getApiData(res.data) ?? []
		return parseOrThrow({ parse: (v) => recruitmentAttemptSummarySchema.array().parse(v) }, data)
	},

	getMyAttemptById: async (attemptId: number): Promise<RecruitmentAttemptDetail> => {
		const res = await recruitmentApi.get<BackendApiResponse<RecruitmentAttemptDetail>>(`/recruitment/my/attempts/${attemptId}`)
		if (!getApiSuccess(res.data)) throw new Error(apiError(null, 'Failed to load attempt'))
		const data = getApiData(res.data)
		if (!data) throw new Error('No data returned')
		return parseOrThrow(recruitmentAttemptDetailSchema, data)
	},

	// —— Admin CRUD: API only, no local fallback. Errors surface so you can fix API/DB. ——

	getAdminTests: async (): Promise<RecruitmentTestSummary[]> => {
		const res = await recruitmentApi.get<BackendApiResponse<RecruitmentTestSummary[]>>('/recruitment/admin/tests')
		if (!getApiSuccess(res.data)) throw new Error(getApiErrors(res.data)[0] || getApiMessage(res.data) || 'Failed to load tests')
		const data = getApiData(res.data) ?? []
		const raw = parseOrThrow({ parse: (v) => recruitmentTestSummarySchema.array().parse(v) }, data)
		return raw.map((t: RecruitmentTestSummary & { TestId?: string }) => ({
			...t,
			testId: String(t.testId ?? t.TestId ?? '').trim(),
		})) as RecruitmentTestSummary[]
	},

	getAdminTestById: async (testId: string): Promise<RecruitmentAdminTest> => {
		const id = String(testId ?? '').trim()
		if (!id) throw new Error('Test ID is required')
		try {
			const res = await recruitmentApi.get<BackendApiResponse<RecruitmentAdminTest>>(`/recruitment/admin/tests/${encodeURIComponent(id)}`)
			if (!getApiSuccess(res.data)) throw new Error(getApiErrors(res.data)[0] || getApiMessage(res.data) || 'Test not found')
			const data = getApiData(res.data)
			if (!data) throw new Error('No data returned')
			return parseOrThrow(recruitmentAdminTestSchema, data)
		} catch (err) {
			throw new Error(apiError(err, 'Failed to load test'))
		}
	},

	createAdminTest: async (payload: RecruitmentAdminTest): Promise<RecruitmentAdminTest> => {
		const body = {
			title: payload.title?.trim() ?? '',
			description: payload.description ?? null,
			durationMinutes: payload.durationMinutes ?? 30,
			totalPoints: payload.totalPoints ?? 100,
			passThresholdPercentage: payload.passThresholdPercentage ?? 80,
			status: (payload.status?.trim() || 'draft').toLowerCase(),
			scheduledDate: payload.scheduledDate ?? null,
			questions: (payload.questions ?? []).map((q, idx) => ({
				questionId: q.questionId || undefined,
				type: (q.type ?? 'multiple-choice').toString().toLowerCase(),
				text: q.text ?? '',
				points: q.points ?? 1,
				sortOrder: q.sortOrder ?? idx + 1,
				correctAnswerText: q.correctAnswerText ?? null,
				options: (q.options ?? []).map((o, oidx) => ({
					optionId: o.optionId ?? null,
					text: o.text ?? '',
					sortOrder: o.sortOrder ?? oidx + 1,
					isCorrect: Boolean(o.isCorrect),
				})),
			})),
		}
		try {
			const res = await recruitmentApi.post<BackendApiResponse<RecruitmentAdminTest>>('/recruitment/admin/tests', body)
			if (!getApiSuccess(res.data)) throw new Error(getApiErrors(res.data)[0] || getApiMessage(res.data) || 'Failed to create test')
			const data = getApiData(res.data)
			if (!data) throw new Error('No data returned')
			return parseOrThrow(recruitmentAdminTestSchema, data)
		} catch (err) {
			throw new Error(apiError(err, 'Failed to create test'))
		}
	},

	updateAdminTest: async (testId: string, payload: RecruitmentAdminTest): Promise<RecruitmentAdminTest> => {
		const id = String(testId ?? '').trim()
		if (!id) throw new Error('Test ID is required')
		try {
			const res = await recruitmentApi.put<BackendApiResponse<RecruitmentAdminTest>>(`/recruitment/admin/tests/${encodeURIComponent(id)}`, payload)
			if (!getApiSuccess(res.data)) throw new Error(getApiErrors(res.data)[0] || getApiMessage(res.data) || 'Failed to update test')
			const data = getApiData(res.data)
			if (!data) throw new Error('No data returned')
			return parseOrThrow(recruitmentAdminTestSchema, data)
		} catch (err) {
			throw new Error(apiError(err, 'Failed to update test'))
		}
	},

	deleteAdminTest: async (testId: string): Promise<void> => {
		const id = String(testId ?? '').trim()
		if (!id) throw new Error('Test ID is required')
		try {
			const res = await recruitmentApi.delete<BackendApiResponse<{ deleted: boolean }>>(`/recruitment/admin/tests/${encodeURIComponent(id)}`)
			if (!getApiSuccess(res.data)) throw new Error(getApiErrors(res.data)[0] || getApiMessage(res.data) || 'Failed to delete test')
		} catch (err) {
			throw new Error(apiError(err, 'Failed to delete test'))
		}
	},

	getAdminAttempts: async (testId?: string): Promise<RecruitmentAttemptSummary[]> => {
		const res = await recruitmentApi.get<BackendApiResponse<RecruitmentAttemptSummary[]>>('/recruitment/admin/attempts', { params: testId ? { testId } : undefined })
		if (!getApiSuccess(res.data)) throw new Error(apiError(null, 'Failed to load attempts'))
		const data = getApiData(res.data) ?? []
		return parseOrThrow({ parse: (v) => recruitmentAttemptSummarySchema.array().parse(v) }, data)
	},

	getAdminAttemptById: async (attemptId: number): Promise<RecruitmentAttemptDetail> => {
		const res = await recruitmentApi.get<BackendApiResponse<RecruitmentAttemptDetail>>(`/recruitment/admin/attempts/${attemptId}`)
		if (!getApiSuccess(res.data)) throw new Error(apiError(null, 'Failed to load attempt'))
		const data = getApiData(res.data)
		if (!data) throw new Error('No data returned')
		return parseOrThrow(recruitmentAttemptDetailSchema, data)
	},
}
