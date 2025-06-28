import { z } from 'zod';

// Define the schema for environment variables
const envSchema = z.object({
  VITE_API_URL: z.string().url().min(1, 'API URL is required'),
  VITE_SIGNALR_URL: z.string().url().min(1, 'SignalR URL is required'),
  VITE_APP_TITLE: z.string().min(1, 'App title is required').default('ServiceBridge Scanner'),
});

// Parse and validate environment variables
const parseEnv = () => {
  const parsed = envSchema.safeParse(import.meta.env);
  
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }
  
  return parsed.data;
};

// Export validated environment variables
export const env = parseEnv();

// Type-safe environment variable access
export type Env = z.infer<typeof envSchema>;