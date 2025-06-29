import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { useAuth } from '../hooks/AuthContext';
import { env } from '../../../config/env';

export function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            {env.VITE_APP_TITLE}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the inventory scanner
          </p>
        </div>
        
        <LoginForm />
        
        <div className="text-center text-sm text-gray-500">
          <p>Demo Credentials:</p>
          <p className="font-mono">scanner1@servicebridge.com / scanner123</p>
          <p className="text-xs mt-2">Admin: admin@servicebridge.com / admin123</p>
        </div>
      </div>
    </div>
  );
}