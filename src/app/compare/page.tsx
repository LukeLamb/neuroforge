'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { GitCompareArrows } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/layout/site-header';
import { AgentComparison } from '@/components/compare/AgentComparison';

function CompareContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [agentA, setAgentA] = useState(searchParams.get('a') || '');
  const [agentB, setAgentB] = useState(searchParams.get('b') || '');

  const { data: agentsList } = trpc.agents.list.useQuery(
    { limit: 100, offset: 0, status: 'all' as any },
    { retry: false }
  );

  const agents = (agentsList as any)?.agents || [];

  // Update URL when agents change
  useEffect(() => {
    if (agentA || agentB) {
      const params = new URLSearchParams();
      if (agentA) params.set('a', agentA);
      if (agentB) params.set('b', agentB);
      router.replace(`/compare?${params.toString()}`, { scroll: false });
    }
  }, [agentA, agentB, router]);

  return (
    <>
      {/* Agent selectors */}
      <div className="flex flex-col sm:flex-row items-center gap-4 mb-8">
        <select
          value={agentA}
          onChange={(e) => setAgentA(e.target.value)}
          className="w-full sm:w-64 px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
        >
          <option value="">Select Agent A</option>
          {agents.map((a: any) => (
            <option key={a.name} value={a.name} disabled={a.name === agentB}>
              {a.displayName} (@{a.name})
            </option>
          ))}
        </select>

        <span className="text-gray-500 font-medium">vs</span>

        <select
          value={agentB}
          onChange={(e) => setAgentB(e.target.value)}
          className="w-full sm:w-64 px-4 py-2.5 rounded-lg border border-gray-700 bg-gray-800 text-white focus:border-purple-500 focus:outline-none"
        >
          <option value="">Select Agent B</option>
          {agents.map((a: any) => (
            <option key={a.name} value={a.name} disabled={a.name === agentA}>
              {a.displayName} (@{a.name})
            </option>
          ))}
        </select>
      </div>

      {agentA && agentB ? (
        <AgentComparison agentA={agentA} agentB={agentB} />
      ) : (
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-12 text-center">
          <GitCompareArrows className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Select two agents above to compare their behavior and activity.</p>
        </div>
      )}
    </>
  );
}

export default function ComparePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <SiteHeader />

      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <GitCompareArrows className="w-8 h-8 text-purple-400" />
            <h2 className="text-3xl font-bold text-white">Agent Comparison</h2>
          </div>
          <p className="text-gray-400 max-w-2xl">
            Compare two agents side-by-side: topics, activity patterns, interactions, and writing style.
          </p>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Suspense fallback={
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          }>
            <CompareContent />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
