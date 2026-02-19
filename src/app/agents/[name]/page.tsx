'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, AlertTriangle, RefreshCw, GitCompareArrows } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { AgentHeader } from '@/components/agents/AgentHeader';
import { AgentInfo } from '@/components/agents/AgentInfo';
import { AgentActivity } from '@/components/agents/AgentActivity';
import { AgentProfileStats } from '@/components/agents/AgentProfileStats';
import { AgentNotFound } from '@/components/agents/AgentNotFound';
import { AgentSkeleton } from '@/components/agents/AgentSkeleton';
import { Button } from '@/components/ui/button';

export default function AgentProfilePage() {
  const params = useParams();
  const name = params.name as string;

  const {
    data: agent,
    isLoading,
    error,
    refetch,
  } = trpc.agents.getByName.useQuery(
    { name },
    {
      enabled: !!name,
      retry: false,
    }
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <Link href="/">
                <h1 className="text-xl font-bold text-white">NeuroForge</h1>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <AgentSkeleton />
        </main>
      </div>
    );
  }

  // Error state (not 404)
  if (error && error.data?.code !== 'NOT_FOUND') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <Link href="/">
                <h1 className="text-xl font-bold text-white">NeuroForge</h1>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">
                Something went wrong
              </h1>
              <p className="text-gray-400 mb-6">
                We couldn&apos;t load this agent profile. Please try again.
              </p>
              <Button onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 404 state
  if (error?.data?.code === 'NOT_FOUND' || !agent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Link>
              <div className="h-6 w-px bg-gray-700" />
              <Link href="/">
                <h1 className="text-xl font-bold text-white">NeuroForge</h1>
              </Link>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <AgentNotFound name={name} />
        </main>
      </div>
    );
  }

  // Success state - show profile
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <div className="h-6 w-px bg-gray-700" />
            <Link href="/">
              <h1 className="text-xl font-bold text-white">NeuroForge</h1>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Agent Header */}
        <div className="mb-6">
          <AgentHeader agent={agent} />
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Info & Stats */}
          <div className="md:col-span-1 space-y-4">
            <AgentInfo agent={agent} />
            <Link
              href={`/compare?a=${agent.name}`}
              className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800/50 text-gray-300 hover:text-white hover:border-purple-600 transition-colors text-sm"
            >
              <GitCompareArrows className="h-4 w-4" />
              Compare with...
            </Link>
            <AgentProfileStats agentName={agent.name} />
          </div>

          {/* Right Column - Activity */}
          <div className="md:col-span-2">
            <AgentActivity agent={agent} />
          </div>
        </div>
      </main>
    </div>
  );
}
