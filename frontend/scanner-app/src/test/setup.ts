import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock logger
vi.mock('../features/shared/services/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    logUserAction: vi.fn(),
    logSecurityEvent: vi.fn(),
    logPerformanceMetric: vi.fn(),
  },
}))

// Mock authService
vi.mock('../features/auth/services/authService', () => ({
  authService: {
    login: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(() => null),
    refreshToken: vi.fn(),
    subscribe: vi.fn((callback) => {
      // Immediately call with a default state
      callback({ isAuthenticated: false, user: null, tokens: null });
      // Return an unsubscribe function
      return () => {};
    }),
    getState: vi.fn(() => ({ isAuthenticated: false, user: null, tokens: null })),
    getAccessToken: vi.fn(() => null),
    hasPermission: vi.fn(() => false),
    hasRole: vi.fn(() => false),
    hasAnyRole: vi.fn(() => false),
    forceRefresh: vi.fn(),
  },
}));

// Mock SignalR Service
vi.mock('../features/shared/services/signalr', () => ({
  SignalRService: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    send: vi.fn(),
  })),
}))

// Mock navigation
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000/',
    replace: vi.fn(),
  },
  writable: true,
})