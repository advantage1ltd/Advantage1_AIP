import { PageHeaderData } from '@/types/header';

const BASE_URL = '/api/headers';

export const headerService = {
  // Get header data
  getHeaderData: async (pageId: string): Promise<PageHeaderData> => {
    try {
      const response = await fetch(`${BASE_URL}/${pageId}`);
      if (!response.ok) throw new Error('Failed to fetch header data');
      return response.json();
    } catch (error) {
      console.error('Error fetching header data:', error);
      throw error;
    }
  },

  // Update header data
  updateHeaderData: async (pageId: string, data: PageHeaderData): Promise<PageHeaderData> => {
    try {
      const response = await fetch(`${BASE_URL}/${pageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update header data');
      return response.json();
    } catch (error) {
      console.error('Error updating header data:', error);
      throw error;
    }
  },

  // Delete header data
  deleteHeaderData: async (pageId: string): Promise<void> => {
    try {
      const response = await fetch(`${BASE_URL}/${pageId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete header data');
    } catch (error) {
      console.error('Error deleting header data:', error);
      throw error;
    }
  }
}; 