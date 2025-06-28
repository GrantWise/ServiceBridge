import { useState, useEffect } from 'react';
import { Wifi, WifiOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignalRService, ConnectionState } from '@/services/signalr';

interface ConnectionIndicatorProps {
  signalRService: SignalRService;
  className?: string;
}

export function ConnectionIndicator({ signalRService, className }: ConnectionIndicatorProps) {
  const [connectionState, setConnectionState] = useState<ConnectionState>(
    signalRService.getConnectionState()
  );

  useEffect(() => {
    const handleStateChange = (state: ConnectionState) => {
      setConnectionState(state);
    };

    signalRService.onStateChange(handleStateChange);
    return () => {
      // Cleanup handled by SignalR service
    };
  }, [signalRService]);

  const getStatusIcon = () => {
    if (connectionState.isConnecting) {
      return <Clock className="h-4 w-4 animate-spin text-yellow-500" />;
    }
    if (connectionState.isConnected) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (connectionState.error) {
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
    return <WifiOff className="h-4 w-4 text-gray-400" />;
  };

  const getStatusText = () => {
    if (connectionState.isConnecting) {
      return 'Connecting...';
    }
    if (connectionState.isConnected) {
      return 'Connected';
    }
    if (connectionState.error) {
      return 'Disconnected';
    }
    return 'Offline';
  };

  const getStatusColor = () => {
    if (connectionState.isConnecting) {
      return 'text-yellow-600';
    }
    if (connectionState.isConnected) {
      return 'text-green-600';
    }
    if (connectionState.error) {
      return 'text-red-600';
    }
    return 'text-gray-500';
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {getStatusIcon()}
      <span className={cn('font-medium', getStatusColor())}>
        {getStatusText()}
      </span>
      {connectionState.connectionId && (
        <span className="text-xs text-muted-foreground">
          ({connectionState.connectionId.slice(-8)})
        </span>
      )}
    </div>
  );
} 