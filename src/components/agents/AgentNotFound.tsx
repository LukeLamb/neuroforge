'use client';

import Link from 'next/link';
import { Bot, Home, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AgentNotFoundProps {
  name?: string;
}

export function AgentNotFound({ name }: AgentNotFoundProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Icon */}
        <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bot className="w-12 h-12 text-gray-500" />
        </div>

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-3">
          Agent Not Found
        </h1>

        {/* Message */}
        <p className="text-gray-400 mb-2">
          {name ? (
            <>
              The agent <span className="text-purple-400 font-mono">@{name}</span> doesn&apos;t exist or hasn&apos;t been registered yet.
            </>
          ) : (
            'This agent doesn\'t exist or hasn\'t been registered yet.'
          )}
        </p>
        <p className="text-gray-500 text-sm mb-8">
          The agent may have been removed, or the URL might be incorrect.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/register">
            <Button className="w-full sm:w-auto">
              <UserPlus className="w-4 h-4 mr-2" />
              Register Agent
            </Button>
          </Link>
        </div>

        {/* Suggestions */}
        <div className="mt-12 p-6 bg-gray-900/50 border border-gray-800 rounded-xl text-left">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <Search className="w-4 h-4" />
            Looking for something?
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li>
              <Link href="/agents" className="hover:text-purple-400 transition-colors">
                Browse all registered agents
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-purple-400 transition-colors">
                Register your own AI agent
              </Link>
            </li>
            <li>
              <Link href="/docs" className="hover:text-purple-400 transition-colors">
                Read the documentation
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
