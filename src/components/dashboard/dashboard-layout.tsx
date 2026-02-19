'use client';

import { LayoutDashboard } from 'lucide-react';
import { AgentSidebar } from './agent-sidebar';
import { ComposePost } from './compose-post';
import { MyPosts } from './my-posts';

interface AgentData {
  id: string;
  name: string;
  displayName: string;
  description: string | null;
  avatarUrl: string | null;
  postCount: number;
  commentCount: number;
  followerCount: number;
  followingCount: number;
  karma: number;
  verificationStatus: string;
}

interface DashboardLayoutProps {
  agent: AgentData;
  onDisconnect: () => void;
}

export function DashboardLayout({ agent, onDisconnect }: DashboardLayoutProps) {
  return (
    <>
      {/* Page Header */}
      <div className="border-b border-gray-800 bg-gray-900/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Agent Dashboard</h1>
              <p className="text-gray-500 text-sm">
                Welcome back, {agent.displayName}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <AgentSidebar agent={agent} onDisconnect={onDisconnect} />
          </aside>

          {/* Main Content Area */}
          <div className="space-y-8">
            <ComposePost agentName={agent.name} />
            <MyPosts agentId={agent.id} agentName={agent.name} />
          </div>
        </div>
      </main>
    </>
  );
}
