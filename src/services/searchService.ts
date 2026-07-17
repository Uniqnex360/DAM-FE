import { api } from "../lib/api";
import { extractErrorMessage } from "../utils/errorService";
import { SearchFilterOptions, SearchFilters, SearchResponse, SearchResult, FilterOption } from '../types/interface';



export const searchService = {
  async searchImages(filters: SearchFilters): Promise<SearchResponse> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const { data } = await api.get<SearchResponse>(`/search/images?${params}`);
      return data;
    } catch (error: unknown) {
      console.error("[searchService.searchImages]", error);
      throw extractErrorMessage(error, "Failed to search images");
    }
  },

  async getFilters(userId?: string, allUsers?: boolean): Promise<SearchFilterOptions> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (allUsers) params.append('all_users', 'true');

      const { data } = await api.get<SearchFilterOptions>(`/search/filters?${params}`);
      return data;
    } catch (error: unknown) {
      console.error("[searchService.getFilters]", error);
      throw extractErrorMessage(error, "Failed to get search filters");
    }
  },

  async searchByProject(projectName: string, userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        project_name: projectName,
        user_id: userId,
        all_users: allUsers,
        limit: 100,
        sort_by: "newest"
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.searchByProject]", error);
      throw extractErrorMessage(error, `Failed to search images in project: ${projectName}`);
    }
  },

  async searchByStatus(status: string, userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        status,
        user_id: userId,
        all_users: allUsers,
        limit: 100,
        sort_by: "newest"
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.searchByStatus]", error);
      throw extractErrorMessage(error, `Failed to search images with status: ${status}`);
    }
  },

  async searchByOperations(operations: string[], userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        operations: operations.join(','),
        user_id: userId,
        all_users: allUsers,
        limit: 100,
        sort_by: "newest"
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.searchByOperations]", error);
      throw extractErrorMessage(error, `Failed to search images with operations: ${operations.join(', ')}`);
    }
  },

  async getImageById(imageId: string): Promise<SearchResult | null> {
    try {
      const filters: SearchFilters = {
        q: imageId,
        limit: 1
      };

      const response = await this.searchImages(filters);
      return response.results.find(img => img.id === imageId) || null;
    } catch (error: unknown) {
      console.error("[searchService.getImageById]", error);
      throw extractErrorMessage(error, `Failed to get image: ${imageId}`);
    }
  },

  async getRecentImages(limit: number = 20, userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        sort_by: "newest",
        limit,
        user_id: userId,
        all_users: allUsers
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.getRecentImages]", error);
      throw extractErrorMessage(error, "Failed to get recent images");
    }
  },

  async getProcessedImages(userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        has_output: true,
        sort_by: "newest",
        limit: 100,
        user_id: userId,
        all_users: allUsers
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.getProcessedImages]", error);
      throw extractErrorMessage(error, "Failed to get processed images");
    }
  },

  async searchInDateRange(dateFrom: string, dateTo: string, userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        date_from: dateFrom,
        date_to: dateTo,
        sort_by: "newest",
        limit: 100,
        user_id: userId,
        all_users: allUsers
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.searchInDateRange]", error);
      throw extractErrorMessage(error, `Failed to search images between ${dateFrom} and ${dateTo}`);
    }
  },

  // Utility methods for common search patterns
  async quickSearch(query: string, userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        q: query,
        limit: 20,
        sort_by: "newest",
        user_id: userId,
        all_users: allUsers
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.quickSearch]", error);
      throw extractErrorMessage(error, `Failed to perform quick search for: ${query}`);
    }
  },

  async getImagesByAspectRatio(aspectRatio: string, userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        aspect_ratio: aspectRatio,
        sort_by: "newest",
        limit: 100,
        user_id: userId,
        all_users: allUsers
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.getImagesByAspectRatio]", error);
      throw extractErrorMessage(error, `Failed to get images with aspect ratio: ${aspectRatio}`);
    }
  },

  async getFailedImages(userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        status: "failed",
        sort_by: "newest",
        limit: 100,
        user_id: userId,
        all_users: allUsers
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.getFailedImages]", error);
      throw extractErrorMessage(error, "Failed to get failed images");
    }
  },

  async getPendingImages(userId?: string, allUsers?: boolean): Promise<SearchResponse> {
    try {
      const filters: SearchFilters = {
        status: "pending",
        sort_by: "newest",
        limit: 100,
        user_id: userId,
        all_users: allUsers
      };

      return await this.searchImages(filters);
    } catch (error: unknown) {
      console.error("[searchService.getPendingImages]", error);
      throw extractErrorMessage(error, "Failed to get pending images");
    }
  }
};

