import { Component, type ReactNode, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface IErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

interface IErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

export class ErrorBoundary extends Component<IErrorBoundaryProps, IErrorBoundaryState> {
  constructor(props: IErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<IErrorBoundaryState> {
    // Generate a unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error(`Error Boundary Caught [${errorId}]:`, error);
    }

    return {
      hasError: true,
      error,
      errorId,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    console.error('Error Details:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
    });

    // In production, this would send to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
    
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleNavigateHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                An unexpected error occurred. The error has been logged and our team has been notified.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-100 rounded-lg p-4">
                  <p className="text-sm font-mono text-gray-700">
                    {this.state.error.message || 'An unknown error occurred'}
                  </p>
                </div>
                
                {import.meta.env.DEV && (
                  <details className="cursor-pointer">
                    <summary className="text-sm text-gray-600 hover:text-gray-800">
                      Show technical details
                    </summary>
                    <pre className="mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
                
                <p className="text-xs text-gray-500">
                  Error ID: {this.state.errorId}
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button
                onClick={this.handleReset}
                variant="default"
                className="w-full sm:w-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                className="w-full sm:w-auto"
              >
                Reload Page
              </Button>
              
              <Button
                onClick={this.handleNavigateHome}
                variant="outline"
                className="w-full sm:w-auto"
              >
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}