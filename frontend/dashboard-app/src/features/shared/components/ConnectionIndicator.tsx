import { Wifi, WifiOff, Loader2, Users, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useConnectionStatus } from '../hooks/useSignalR';
import { cn } from '@/lib/utils';

interface ConnectionIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function ConnectionIndicator({ className, showDetails = false }: ConnectionIndicatorProps) {
  const { isConnected, isConnecting, connectionCount, error } = useConnectionStatus();

  const getStatusIcon = () => {
    if (isConnecting) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    if (isConnected) {
      return <Wifi className="h-4 w-4" />;
    }
    return <WifiOff className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (isConnecting) return 'Connecting...';
    if (isConnected) return 'Connected';
    return 'Disconnected';
  };

  const getStatusColor = () => {
    if (isConnecting) return 'bg-yellow-500';
    if (isConnected) return 'bg-green-500';
    return 'bg-red-500';
  };

  const indicator = (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <div className={cn('h-2 w-2 rounded-full', getStatusColor())} />
        {getStatusIcon()}
        {showDetails && (
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
        )}
      </div>
      
      {isConnected && showDetails && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-3 w-3" />
          <span>{connectionCount}</span>
        </div>
      )}
      
      {error && (
        <AlertCircle className="h-4 w-4 text-destructive" />
      )}
    </div>
  );

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {indicator}
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">SignalR Connection</p>
              <p className="text-sm">Status: {getStatusText()}</p>
              {isConnected && (
                <p className="text-sm">Active Users: {connectionCount}</p>
              )}
              {error && (
                <p className="text-sm text-destructive">Error: {error}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return indicator;
}

// Badge variant for header or status bars
export function ConnectionBadge() {
  const { isConnected, isConnecting } = useConnectionStatus();

  const variant = isConnected ? 'default' : isConnecting ? 'secondary' : 'destructive';
  const text = isConnected ? 'Online' : isConnecting ? 'Connecting' : 'Offline';

  return (
    <Badge variant={variant} className="gap-1">
      <div className={cn(
        'h-2 w-2 rounded-full',
        isConnected ? 'bg-green-500' : isConnecting ? 'bg-yellow-500' : 'bg-red-500'
      )} />
      {text}
    </Badge>
  );
}