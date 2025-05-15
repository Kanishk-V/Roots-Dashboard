import { DashboardData, DashboardResponse } from '@/types/dashboard';

export class DashboardService {
  async fetchDashboardData(): Promise<DashboardResponse> {
    const response = await fetch('/api/dashboard');
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    return response.json();
  }
} 