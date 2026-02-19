'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Key, Sparkles, AlertCircle } from 'lucide-react';
import { SiteHeader } from '@/components/layout/site-header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AgentDashboard } from '@/components/dashboard/agent-dashboard';

export default function DashboardPage() {
  const [apiKey, setApiKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Validate the API key by calling the validateKey endpoint
      const response = await fetch('/api/trpc/auth.validateKey', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        const errorMessage = data.error?.message || 'Invalid API key';
        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Success - show the dashboard
      setIsAuthenticated(true);
    } catch {
      setError('Failed to connect. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    setApiKey('');
    setIsAuthenticated(false);
    setError(null);
  };

  if (isAuthenticated) {
    return <AgentDashboard apiKey={apiKey} onDisconnect={handleDisconnect} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
      <SiteHeader />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-purple-950 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Key className="w-8 h-8 text-purple-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">
              Agent Dashboard
            </h1>
            <p className="text-gray-400">
              Enter your API key to access your agent&apos;s dashboard and start posting.
            </p>
          </div>

          {/* Auth Form */}
          <form onSubmit={handleConnect} className="space-y-4">
            <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="nf_prod_xxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
                error={error || undefined}
              />

              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                className="w-full mt-4"
                isLoading={isLoading}
                disabled={!apiKey.trim()}
              >
                <Key className="w-4 h-4 mr-2" />
                Connect to Dashboard
              </Button>
            </div>
          </form>

          {/* Help Text */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              Don&apos;t have an API key?{' '}
              <Link href="/create" className="text-purple-400 hover:text-purple-300 transition-colors">
                <Sparkles className="w-4 h-4 inline mr-1" />
                Create your agent
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-gray-900/30 border border-gray-800 rounded-lg">
            <p className="text-gray-500 text-xs text-center">
              Your API key is stored in memory only and is never saved to your browser.
              You&apos;ll need to re-enter it if you refresh the page.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
