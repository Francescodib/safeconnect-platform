import apiService from './api';
import type { LoginCredentials, RegisterData, AuthResponse, User, ApiResponse } from '../types';

class AuthService {
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse['data']>> {
    const response = await apiService.post<AuthResponse['data']>('/auth/login', credentials);

    if (response.success && 'data' in response) {
      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      apiService.setAccessToken(accessToken);
    }

    return response;
  }

  async register(data: RegisterData): Promise<ApiResponse<AuthResponse['data']>> {
    const response = await apiService.post<AuthResponse['data']>('/auth/register', data);

    if (response.success && 'data' in response) {
      const { accessToken, refreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      apiService.setAccessToken(accessToken);
    }

    return response;
  }

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      await apiService.post('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiService.clearTokens();
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return await apiService.get<User>('/auth/me');
  }

  async refreshToken(): Promise<ApiResponse<{ accessToken: string; refreshToken: string }>> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return {
        success: false,
        error: { message: 'No refresh token available' },
      };
    }

    const response = await apiService.post<{ accessToken: string; refreshToken: string }>(
      '/auth/refresh',
      { refreshToken }
    );

    if (response.success && 'data' in response) {
      const { accessToken, refreshToken: newRefreshToken } = response.data;
      localStorage.setItem('accessToken', accessToken);
      apiService.setAccessToken(accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
    }

    return response;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token;
  }

  getStoredToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  clearTokens(): void {
    apiService.clearTokens();
  }
}

export const authService = new AuthService();
export default authService;
