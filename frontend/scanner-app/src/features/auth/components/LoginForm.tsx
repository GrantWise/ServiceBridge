import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '../../shared/components/button';
import { Input } from '../../shared/components/input';
import { Label } from '../../shared/components/label';
import { 
  EnterpriseCard, 
  EnterpriseCardContent, 
  EnterpriseCardDescription, 
  EnterpriseCardFooter, 
  EnterpriseCardHeader, 
  EnterpriseCardTitle 
} from '../../shared/components/enterprise-card';
import { Alert, AlertDescription } from '../../shared/components/alert';
import { useAuth } from '../hooks/AuthContext';
import { logger } from '../../shared/services/logger';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1, 'Email is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = location.state?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      logger.logUserAction('login_attempt', { email: data.email });
      
      const response = await login(data);
      
      if (response.success) {
        logger.logUserAction('login_success', { 
          userId: response.user.id,
          role: response.user.role 
        });
        
        // Navigate to the page they were trying to access or home
        navigate(from, { replace: true });
      } else {
        setError(response.message || 'Login failed');
        logger.logUserAction('login_failed', { 
          email: data.email,
          reason: response.message 
        });
      }
    } catch (err: unknown) {
      // Check if it's a network error (backend not available)
      const error = err as { code?: string; message?: string; response?: { status?: number } };
      if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
        setError('Cannot connect to server. Please ensure the backend is running.');
      } else if (error?.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
      logger.error('Login error', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <EnterpriseCard 
      className="w-full max-w-md"
      elevation={3}
      variant="glass"
      hover="lift"
    >
      <EnterpriseCardHeader className="space-y-1">
        <EnterpriseCardTitle className="text-2xl font-bold text-center">Sign in</EnterpriseCardTitle>
        <EnterpriseCardDescription className="text-center">
          Enter your email and password to access the scanner
        </EnterpriseCardDescription>
      </EnterpriseCardHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <EnterpriseCardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              {...register('email')}
              disabled={isLoading}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-500">
                {errors.email.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                autoComplete="current-password"
                {...register('password')}
                disabled={isLoading}
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {errors.password && (
              <p id="password-error" className="text-sm text-red-500">
                {errors.password.message}
              </p>
            )}
          </div>
        </EnterpriseCardContent>
        
        <EnterpriseCardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LogIn className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Sign in
              </>
            )}
          </Button>
        </EnterpriseCardFooter>
      </form>
    </EnterpriseCard>
  );
}