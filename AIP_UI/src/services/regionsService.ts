import { Region } from '@/types/customer';
import { DUMMY_REGIONS } from '@/data/mockRegions';

class RegionsService {
  private regions: Region[] = [...DUMMY_REGIONS];

  async getRegions(): Promise<{ success: boolean; data: Region[] }> {
    try {
      return {
        success: true,
        data: this.regions
      };
    } catch (error) {
      return {
        success: false,
        data: []
      };
    }
  }

  async getRegionsByCustomer(customerId: number): Promise<{ success: boolean; data: Region[] }> {
    try {
      const customerRegions = this.regions.filter(region => region.fkCustomerID === customerId);
      return {
        success: true,
        data: customerRegions
      };
    } catch (error) {
      return {
        success: false,
        data: []
      };
    }
  }

  async createRegion(regionData: Omit<Region, 'regionID' | 'dateCreated' | 'dateModified'>): Promise<{ success: boolean; data?: Region; message?: string }> {
    try {
      const newRegion: Region = {
        ...regionData,
        regionID: Date.now(), // Simple ID generation
        dateCreated: new Date().toISOString(),
        dateModified: undefined
      };

      this.regions.push(newRegion);

      return {
        success: true,
        data: newRegion
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create region'
      };
    }
  }

  async updateRegion(id: number, updates: Partial<Omit<Region, 'regionID' | 'dateCreated'>>): Promise<{ success: boolean; data?: Region; message?: string }> {
    try {
      const regionIndex = this.regions.findIndex(region => region.regionID === id);
      
      if (regionIndex === -1) {
        return {
          success: false,
          message: 'Region not found'
        };
      }

      const updatedRegion: Region = {
        ...this.regions[regionIndex],
        ...updates,
        dateModified: new Date().toISOString()
      };

      this.regions[regionIndex] = updatedRegion;

      return {
        success: true,
        data: updatedRegion
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to update region'
      };
    }
  }

  async deleteRegion(id: number): Promise<{ success: boolean; message?: string }> {
    try {
      const regionIndex = this.regions.findIndex(region => region.regionID === id);
      
      if (regionIndex === -1) {
        return {
          success: false,
          message: 'Region not found'
        };
      }

      this.regions.splice(regionIndex, 1);

      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to delete region'
      };
    }
  }

  // Method to get fresh data (for reactive updates)
  getRegionsData(): Region[] {
    return [...this.regions];
  }
}

export const regionsService = new RegionsService(); 