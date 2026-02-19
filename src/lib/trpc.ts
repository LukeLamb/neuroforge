import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/server/api/root';

/**
 * tRPC React client
 * Used in client components to call API endpoints
 */
export const trpc = createTRPCReact<AppRouter>();
