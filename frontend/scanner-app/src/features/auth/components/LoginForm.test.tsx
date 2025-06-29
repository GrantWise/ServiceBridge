import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LoginForm } from './LoginForm';
import { AuthProvider } from '../hooks/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { authService } from '../services/authService';

// Mock the auth service
vi.mock('../services/authService', () => ({
  authService: {
    login: vi.fn(),
    isAuthenticated: vi.fn(() => false),
    getUser: vi.fn(() => null),
    subscribe: vi.fn(() => () => {}),
  },
}));

// Mock logger
vi.mock('../../shared/services/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    logUserAction: vi.fn(),
    logSecurityEvent: vi.fn(),
    logPerformanceMetric: vi.fn(),
  },
}));

// Create wrapper with necessary providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      {children}
    </AuthProvider>
  </BrowserRouter>
);

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form elements', () => {
    render(<LoginForm />, { wrapper: TestWrapper });

    // Test form fields
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    
    // Test buttons
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    });
  });

  it('should validate password required', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    // Submit with valid email but no password
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/password is required/i)).toBeInTheDocument();
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const passwordInput = screen.getByLabelText('Password');
    const toggleButton = screen.getByRole('button', { name: /show password/i });

    // Initially password should be hidden
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

    // Click to hide password again
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    authService.login.mockResolvedValue({
      success: true,
      token: 'mock-token',
      user: { id: '1', username: 'test@example.com' },
    });

    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should display error message on login failure', async () => {
    authService.login.mockResolvedValue({
      success: false,
      message: 'Invalid credentials',
    });

    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    authService.login.mockRejectedValue({
      code: 'ERR_NETWORK',
      message: 'Network Error',
    });

    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/cannot connect to server/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during submission', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });
    authService.login.mockReturnValue(loginPromise);

    const user = userEvent.setup();
    render(<LoginForm />, { wrapper: TestWrapper });

    const emailInput = screen.getByLabelText('Email');
    const passwordInput = screen.getByLabelText('Password');
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    // Resolve the login
    resolveLogin!({ success: true });
    
    await waitFor(() => {
      expect(screen.queryByText(/signing in/i)).not.toBeInTheDocument();
    });
  });
});