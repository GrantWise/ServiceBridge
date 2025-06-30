import { useQuery } from '@tanstack/react-query';
import { useSignalR } from './useSignalR';

interface ProtocolStatus {
  status: 'Active' | 'Connected' | 'Error' | 'Disconnected';
  latency: number;
  load: string;
  lastCheck: string;
  error?: string;
}

interface ProtocolMetrics {
  restApi: ProtocolStatus;
  signalR: ProtocolStatus;
  grpc: ProtocolStatus;
  database: ProtocolStatus;
  isRealData: boolean;
  lastUpdated: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5196/api/v1';

export function useProtocolStatus() {
  const { isConnected } = useSignalR();

  const { data: rawProtocolData, isLoading, error } = useQuery({
    queryKey: ['protocol-metrics'],
    queryFn: async () => {
      console.log('Fetching protocol metrics...');
      try {
        const response = await fetch(`${API_BASE_URL}/monitoring/protocols`, {
          credentials: 'include', // Include cookies for authentication
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('Raw protocol data:', data);
        
        // Return the raw data without processing SignalR status here
        return {
          restApi: data.protocols.restApi,
          signalR: data.protocols.signalR,
          grpc: data.protocols.grpc,
          database: data.protocols.database,
          isRealData: data.isRealData || true,
          lastUpdated: data.lastUpdated
        };
      } catch (error) {
        console.warn('Failed to fetch protocol metrics, using fallback:', error);
        
        // Fallback to basic status if monitoring endpoint is unavailable
        return {
          restApi: {
            status: 'Error',
            latency: -1,
            load: 'Unknown',
            lastCheck: new Date().toISOString()
          },
          signalR: {
            status: 'Disconnected',
            latency: -1,
            load: 'Fallback mode',
            lastCheck: new Date().toISOString()
          },
          grpc: {
            status: 'Error',
            latency: -1,
            load: 'Service unavailable',
            lastCheck: new Date().toISOString(),
            error: 'Monitoring endpoint unavailable'
          },
          database: {
            status: 'Error',
            latency: -1,
            load: 'Unknown',
            lastCheck: new Date().toISOString(),
            error: 'Monitoring endpoint unavailable'
          },
          isRealData: false,
          lastUpdated: new Date().toISOString()
        };
      }
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
    retry: 1, // Only retry once on failure
  });

  // Process the data to override SignalR status with real connection state
  const protocolData = rawProtocolData ? {
    ...rawProtocolData,
    signalR: {
      ...rawProtocolData.signalR,
      status: isConnected ? 'Connected' : 'Disconnected' // Override with real SignalR status
    }
  } : null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Connected':
        return 'bg-green-500';
      case 'Error':
      case 'Disconnected':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'Active':
      case 'Connected':
        return 'text-green-600';
      case 'Error':
      case 'Disconnected':
        return 'text-red-600';
      default:
        return 'text-yellow-600';
    }
  };

  return {
    protocols: protocolData || {
      restApi: { status: 'Error' as const, latency: -1, load: 'Loading...', lastCheck: '' },
      signalR: { status: isConnected ? 'Connected' as const : 'Disconnected' as const, latency: -1, load: 'Loading...', lastCheck: '' },
      grpc: { status: 'Error' as const, latency: -1, load: 'Loading...', lastCheck: '' },
      database: { status: 'Error' as const, latency: -1, load: 'Loading...', lastCheck: '' },
      isRealData: false,
      lastUpdated: ''
    },
    isLoading,
    error,
    isRealData: protocolData?.isRealData || false,
    getStatusColor,
    getStatusTextColor
  };
}