export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: 'Admin' | 'Manager' | 'Operator' | 'Viewer';
  status: 'Active' | 'Inactive' | 'Suspended' | 'Pending';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  permissions: Permission[];
  profile: UserProfile;
  sessions: UserSession[];
}

export interface UserProfile {
  avatar?: string;
  phone?: string;
  department?: string;
  location?: string;
  timezone: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  dashboard: DashboardSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  categories: {
    system: boolean;
    inventory: boolean;
    reports: boolean;
    security: boolean;
  };
}

export interface DashboardSettings {
  defaultPage: string;
  widgets: string[];
  layout: 'compact' | 'comfortable' | 'spacious';
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  actions: string[];
}

export interface UserSession {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isActive: boolean;
  startedAt: Date;
  lastActivity: Date;
  expiresAt: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ipAddress: string;
  timestamp: Date;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  role: User['role'];
  department?: string;
  sendWelcomeEmail: boolean;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: User['role'];
  status?: User['status'];
  department?: string;
  permissions?: string[];
}

export interface UserFilters {
  role?: User['role'];
  status?: User['status'];
  department?: string;
  lastLoginBefore?: Date;
  lastLoginAfter?: Date;
  search?: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<User['role'], number>;
  byDepartment: Record<string, number>;
  recentSignups: number;
  activeToday: number;
}