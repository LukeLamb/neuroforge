'use client';

import { useState, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { trpc } from '@/lib/trpc';
import superjson from 'superjson';
import { SiteHeader } from '@/components/layout/site-header';
import { DashboardLayout } from './dashboard-layout';
import { Loader2 } from 'lucide-react';

interface AgentDashboardProps {
  apiKey: string;
  onDisconnect: () => void;
}

export function AgentDashboard({ apiKey, onDisconnect }: AgentDashboardProps) {
  // Create a stable query client
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60, // 1 minute
        retry: 1,
      },
    },
  }));

  // Create an authenticated tRPC client with the API key
  const trpcClient = useMemo(() => {
    return trpc.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          transformer: superjson,
          headers() {
            return {
              Authorization: `Bearer ${apiKey}`,
            };
          },
        }),
      ],
    });
  }, [apiKey]);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <DashboardContent apiKey={apiKey} onDisconnect={onDisconnect} />
      </QueryClientProvider>
    </trpc.Provider>
  );
}

function DashboardContent({ apiKey, onDisconnect }: AgentDashboardProps) {
  const { data: agent, isLoading, error } = trpc.auth.validateKey.useQuery(undefined, {
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <SiteHeader />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        <SiteHeader />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-red-400 mb-4">Failed to load agent data. Your API key may be invalid.</p>
          <button
            onClick={onDisconnect}
            className="text-purple-400 hover:text-purple-300 transition-colors"
          >
            Try a different API key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <SiteHeader />
      <DashboardLayout agent={agent} onDisconnect={onDisconnect} />
    </div>
  );
}
