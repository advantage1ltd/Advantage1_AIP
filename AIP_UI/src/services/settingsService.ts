import { PageAccess, PageAccessSettings, pageAccessApi } from '@/api/pageAccess';

export const settingsService = {
	getPageAccessSettings: async (): Promise<PageAccessSettings> => {
		return pageAccessApi.getSettings();
	},

	savePageAccessSettings: async (settings: { pageAccessByRole: Record<string, string[]> }, availablePages: PageAccess[] = []): Promise<PageAccessSettings> => {
		// Send PageIds directly (backend handles both PageIds and Titles)
		return pageAccessApi.saveSettings(settings.pageAccessByRole, availablePages);
	},

	resetAdminAccess: async (availablePages: PageAccess[]): Promise<PageAccessSettings> => {
		const currentSettings = await settingsService.getPageAccessSettings();
		const allPageIds = availablePages.map(page => page.id);
		const updatedSettings = {
			pageAccessByRole: {
				...currentSettings.pageAccessByRole,
				administrator: allPageIds
			}
		};
		return settingsService.savePageAccessSettings(updatedSettings, availablePages);
	}
};