/**
 * Helper utility to extract data from backend ApiResponseDto wrapper
 * Handles various response formats from .NET backend
 */
export const extractApiResponseData = <T>(response: any): T[] => {
	if (!response || typeof response !== 'object') {
		return [];
	}

	// Handle direct array
	if (Array.isArray(response)) {
		return response;
	}

	// Handle ApiResponseDto wrapper: { Data: [...] }
	if ('Data' in response && response.Data) {
		const innerData = response.Data;
		
		// Direct array in Data
		if (Array.isArray(innerData)) {
			return innerData;
		}
		
		// Nested ApiResponseDto: { Data: { Data: [...], Pagination: {...} } }
		if (innerData && typeof innerData === 'object' && 'Data' in innerData) {
			return Array.isArray(innerData.Data) ? innerData.Data : [];
		}
		
		// Paginated response: { Data: { items: [...] } }
		if (innerData && typeof innerData === 'object' && 'items' in innerData) {
			return Array.isArray(innerData.items) ? innerData.items : [];
		}
	}

	// Handle lowercase 'data' property
	if ('data' in response && Array.isArray(response.data)) {
		return response.data;
	}

	// Handle 'items' property
	if ('items' in response && Array.isArray(response.items)) {
		return response.items;
	}

	return [];
};

