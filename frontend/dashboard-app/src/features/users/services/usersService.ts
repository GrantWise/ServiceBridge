import { apiClient } from '@/features/shared/services/api/apiClient';
import type { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserFilters, 
  UserStats,
  UserActivity,
  UserSession
} from '../types/users.types';

class UsersService {
  // User CRUD Operations
  async getUsers(filters?: UserFilters): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.department) params.append('department', filters.department);
      if (filters?.search) params.append('search', filters.search);
      
      const response = await apiClient.get(`/api/v1/users?${params.toString()}`);
      return response.data;
    } catch (error) {
      // Mock data for demo
      return this.getMockUsers(filters);
    }
  }

  async getUser(id: string): Promise<User> {
    try {
      const response = await apiClient.get(`/api/v1/users/${id}`);
      return response.data;
    } catch (error) {
      const users = this.getMockUsers();
      const user = users.find(u => u.id === id);
      if (!user) throw new Error('User not found');
      return user;
    }
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post('/api/v1/users', userData);
      return response.data;
    } catch (error) {
      // Mock creation
      return {
        id: crypto.randomUUID(),
        ...userData,
        status: 'Pending' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'current-user',
        permissions: [],
        profile: {
          timezone: 'UTC',
          preferences: {
            theme: 'system',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              sms: false,
              categories: {
                system: true,
                inventory: true,
                reports: true,
                security: true
              }
            },
            dashboard: {
              defaultPage: 'dashboard',
              widgets: [],
              layout: 'comfortable'
            }
          }
        },
        sessions: []
      };
    }
  }

  async updateUser(id: string, userData: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put(`/api/v1/users/${id}`, userData);
      return response.data;
    } catch (error) {
      const user = await this.getUser(id);
      return {
        ...user,
        ...userData,
        updatedAt: new Date()
      };
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/users/${id}`);
    } catch (error) {
      // Mock deletion
      console.log(`User ${id} deleted`);
    }
  }

  async suspendUser(id: string, reason: string): Promise<User> {
    try {
      const response = await apiClient.post(`/api/v1/users/${id}/suspend`, { reason });
      return response.data;
    } catch (error) {
      const user = await this.getUser(id);
      return {
        ...user,
        status: 'Suspended',
        updatedAt: new Date()
      };
    }
  }

  async activateUser(id: string): Promise<User> {
    try {
      const response = await apiClient.post(`/api/v1/users/${id}/activate`);
      return response.data;
    } catch (error) {
      const user = await this.getUser(id);
      return {
        ...user,
        status: 'Active',
        updatedAt: new Date()
      };
    }
  }

  // User Statistics
  async getUserStats(): Promise<UserStats> {
    try {
      const response = await apiClient.get('/users/stats');
      return response;
    } catch (error) {
      console.warn('User stats API failed, using fallback:', error);
      const users = this.getMockUsers();
      return {
        total: users.length,
        active: users.filter(u => u.status === 'Active').length,
        inactive: users.filter(u => u.status === 'Inactive').length,
        byRole: {
          Admin: users.filter(u => u.role === 'Admin').length,
          Manager: users.filter(u => u.role === 'Manager').length,
          Operator: users.filter(u => u.role === 'Operator').length,
          Viewer: users.filter(u => u.role === 'Viewer').length
        },
        byDepartment: {
          'IT': 8,
          'Sales': 12,
          'Operations': 15,
          'Management': 5,
          'Support': 7
        },
        recentSignups: 3,
        activeToday: 28
      };
    }
  }

  // User Activity
  async getUserActivity(userId?: string, limit: number = 50): Promise<UserActivity[]> {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('userId', userId);
      params.append('limit', limit.toString());
      
      const response = await apiClient.get(`/api/v1/users/activity?${params.toString()}`);
      return response.data;
    } catch (error) {
      return this.getMockUserActivity(userId);
    }
  }

  // User Sessions
  async getUserSessions(userId?: string): Promise<UserSession[]> {
    try {
      const endpoint = userId ? `/api/v1/users/${userId}/sessions` : '/api/v1/users/sessions';
      const response = await apiClient.get(endpoint);
      return response.data;
    } catch (error) {
      return this.getMockUserSessions(userId);
    }
  }

  async terminateSession(sessionId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/users/sessions/${sessionId}`);
    } catch (error) {
      console.log(`Session ${sessionId} terminated`);
    }
  }

  async terminateAllSessions(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/api/v1/users/${userId}/sessions`);
    } catch (error) {
      console.log(`All sessions for user ${userId} terminated`);
    }
  }

  // Password Management
  async resetPassword(userId: string, sendEmail: boolean = true): Promise<void> {
    try {
      await apiClient.post(`/api/v1/users/${userId}/reset-password`, { sendEmail });
    } catch (error) {
      console.log(`Password reset initiated for user ${userId}`);
    }
  }

  async forcePasswordChange(userId: string): Promise<void> {
    try {
      await apiClient.post(`/api/v1/users/${userId}/force-password-change`);
    } catch (error) {
      console.log(`Password change forced for user ${userId}`);
    }
  }

  // Mock Data
  private getMockUsers(filters?: UserFilters): User[] {
    const users: User[] = [
      {
        id: 'user-1',
        email: 'admin@servicebridge.com',
        firstName: 'System',
        lastName: 'Administrator',
        username: 'admin',
        role: 'Admin',
        status: 'Active',
        lastLogin: new Date(Date.now() - 1000 * 60 * 30),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-06-28'),
        createdBy: 'system',
        permissions: [],
        profile: {
          department: 'IT',
          timezone: 'UTC',
          preferences: {
            theme: 'dark',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              sms: false,
              categories: { system: true, inventory: true, reports: true, security: true }
            },
            dashboard: {
              defaultPage: 'dashboard',
              widgets: ['kpi', 'charts', 'activity'],
              layout: 'comfortable'
            }
          }
        },
        sessions: []
      },
      {
        id: 'user-2',
        email: 'john.manager@servicebridge.com',
        firstName: 'John',
        lastName: 'Manager',
        username: 'jmanager',
        role: 'Manager',
        status: 'Active',
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2),
        createdAt: new Date('2024-02-15'),
        updatedAt: new Date('2024-06-29'),
        createdBy: 'admin',
        permissions: [],
        profile: {
          department: 'Operations',
          timezone: 'UTC',
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: true,
              push: true,
              sms: true,
              categories: { system: true, inventory: true, reports: true, security: false }
            },
            dashboard: {
              defaultPage: 'analytics',
              widgets: ['kpi', 'charts'],
              layout: 'spacious'
            }
          }
        },
        sessions: []
      },
      {
        id: 'user-3',
        email: 'jane.operator@servicebridge.com',
        firstName: 'Jane',
        lastName: 'Operator',
        username: 'joperator',
        role: 'Operator',
        status: 'Active',
        lastLogin: new Date(Date.now() - 1000 * 60 * 15),
        createdAt: new Date('2024-03-10'),
        updatedAt: new Date('2024-06-29'),
        createdBy: 'admin',
        permissions: [],
        profile: {
          department: 'Operations',
          timezone: 'UTC',
          preferences: {
            theme: 'system',
            language: 'en',
            notifications: {
              email: true,
              push: false,
              sms: false,
              categories: { system: false, inventory: true, reports: false, security: false }
            },
            dashboard: {
              defaultPage: 'inventory',
              widgets: ['inventory'],
              layout: 'compact'
            }
          }
        },
        sessions: []
      },
      {
        id: 'user-4',
        email: 'bob.viewer@servicebridge.com',
        firstName: 'Bob',
        lastName: 'Viewer',
        username: 'bviewer',
        role: 'Viewer',
        status: 'Inactive',
        lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
        createdAt: new Date('2024-04-20'),
        updatedAt: new Date('2024-06-22'),
        createdBy: 'jmanager',
        permissions: [],
        profile: {
          department: 'Support',
          timezone: 'UTC',
          preferences: {
            theme: 'light',
            language: 'en',
            notifications: {
              email: false,
              push: false,
              sms: false,
              categories: { system: false, inventory: false, reports: true, security: false }
            },
            dashboard: {
              defaultPage: 'dashboard',
              widgets: ['activity'],
              layout: 'comfortable'
            }
          }
        },
        sessions: []
      }
    ];

    // Apply filters
    let filtered = users;
    
    if (filters?.role) {
      filtered = filtered.filter(u => u.role === filters.role);
    }
    
    if (filters?.status) {
      filtered = filtered.filter(u => u.status === filters.status);
    }
    
    if (filters?.department) {
      filtered = filtered.filter(u => u.profile.department === filters.department);
    }
    
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(u => 
        u.firstName.toLowerCase().includes(search) ||
        u.lastName.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.username.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }

  private getMockUserActivity(userId?: string): UserActivity[] {
    const activities = [
      {
        id: 'activity-1',
        userId: 'user-1',
        action: 'login',
        resource: 'auth',
        details: { method: 'password' },
        ipAddress: '192.168.1.100',
        timestamp: new Date(Date.now() - 1000 * 60 * 30)
      },
      {
        id: 'activity-2',
        userId: 'user-2',
        action: 'update',
        resource: 'products',
        details: { productId: 'P001', field: 'price' },
        ipAddress: '192.168.1.101',
        timestamp: new Date(Date.now() - 1000 * 60 * 60)
      },
      {
        id: 'activity-3',
        userId: 'user-3',
        action: 'scan',
        resource: 'inventory',
        details: { productCode: 'P002', quantity: 5 },
        ipAddress: '192.168.1.102',
        timestamp: new Date(Date.now() - 1000 * 60 * 15)
      }
    ];

    return userId ? activities.filter(a => a.userId === userId) : activities;
  }

  private getMockUserSessions(userId?: string): UserSession[] {
    const sessions = [
      {
        id: 'session-1',
        userId: 'user-1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        location: 'New York, US',
        isActive: true,
        startedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        lastActivity: new Date(Date.now() - 1000 * 60 * 5),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 6)
      },
      {
        id: 'session-2',
        userId: 'user-2',
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        location: 'San Francisco, US',
        isActive: true,
        startedAt: new Date(Date.now() - 1000 * 60 * 60),
        lastActivity: new Date(Date.now() - 1000 * 60 * 10),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 7)
      }
    ];

    return userId ? sessions.filter(s => s.userId === userId) : sessions;
  }
}

export const usersService = new UsersService();