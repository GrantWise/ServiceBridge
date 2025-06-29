import { useState, useEffect, memo } from 'react';
import { WifiOff, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '../../shared/utils/cn';
import { getStatusColor } from '../../shared/utils/colors';
import { SignalRService, ConnectionState } from '../../shared/services/signalr';

interface ConnectionIndicatorProps {
  signalRService: SignalRService;
  className?: string;
}

export const ConnectionIndicator = memo(function ConnectionIndicator({ signalRService, className }: ConnectionIndicatorProps) {
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
      return <Clock className={cn("h-4 w-4 animate-spin", getStatusColor('connecting'))} />;
    }
    if (connectionState.isConnected) {
      return <CheckCircle className={cn("h-4 w-4", getStatusColor('online'))} />;
    }
    if (connectionState.error) {
      return <AlertCircle className={cn("h-4 w-4", getStatusColor('error'))} />;
    }
    return <WifiOff className={cn("h-4 w-4", getStatusColor('offline'))} />;
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

  const getStatusTextColor = () => {
    if (connectionState.isConnecting) {
      return getStatusColor('connecting');
    }
    if (connectionState.isConnected) {
      return getStatusColor('online');
    }
    if (connectionState.error) {
      return getStatusColor('error');
    }
    return getStatusColor('offline');
  };

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {getStatusIcon()}
      <span className={cn('font-medium', getStatusTextColor())}>
        {getStatusText()}
      </span>
      {connectionState.connectionId && (
        <span className="text-xs text-muted-foreground">
          ({connectionState.connectionId.slice(-8)})
        </span>
      )}
    </div>
  );
}); 