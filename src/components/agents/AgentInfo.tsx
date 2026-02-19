'use client';

import { Bot, Brain, MessageSquare, Calendar, Shield, Globe } from 'lucide-react';

interface PlatformLink {
  name: string;
  url?: string;
  label?: string;
}

interface AgentInfoProps {
  agent: {
    framework: string | null;
    llmProvider: string | null;
    llmModel: string | null;
    verificationStatus: string;
    createdAt: Date | null;
    lastActiveAt: Date | null;
    capabilities?: unknown;
  };
}

export function AgentInfo({ agent }: AgentInfoProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatFramework = (framework: string | null) => {
    if (!framework) return 'Not specified';
    const names: Record<string, string> = {
      custom: 'Custom / Other',
      openclaw: 'OpenClaw',
      autogpt: 'AutoGPT',
      langchain: 'LangChain',
      crewai: 'CrewAI',
      other: 'Other',
    };
    return names[framework] || framework;
  };

  const getStatusInfo = () => {
    switch (agent.verificationStatus) {
      case 'verified':
        return {
          text: 'Verified',
          className: 'text-green-400',
        };
      case 'pending':
      default:
        return {
          text: 'Pending Verification',
          className: 'text-amber-400',
        };
    }
  };

  const statusInfo = getStatusInfo();

  const capabilities = agent.capabilities as { platforms?: PlatformLink[] } | null;
  const platforms: PlatformLink[] = capabilities?.platforms ?? [];

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Agent Information</h2>

      <div className="space-y-4">
        {/* Framework */}
        <div className="flex items-start gap-3">
          <Bot className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-400">Framework</p>
            <p className="text-white">{formatFramework(agent.framework)}</p>
          </div>
        </div>

        {/* LLM Provider - only show if specified */}
        {agent.llmProvider && (
          <div className="flex items-start gap-3">
            <Brain className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">LLM Provider</p>
              <p className="text-white">{agent.llmProvider}</p>
            </div>
          </div>
        )}

        {/* LLM Model - only show if specified */}
        {agent.llmModel && (
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">LLM Model</p>
              <p className="text-white">{agent.llmModel}</p>
            </div>
          </div>
        )}

        {/* Registration Date */}
        <div className="flex items-start gap-3">
          <Calendar className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-400">Registered</p>
            <p className="text-white">{formatDate(agent.createdAt)}</p>
          </div>
        </div>

        {/* Verification Status */}
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-400">Status</p>
            <p className={statusInfo.className}>{statusInfo.text}</p>
          </div>
        </div>

        {/* Platform Links */}
        {platforms.length > 0 && (
          <div className="flex items-start gap-3">
            <Globe className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-gray-400">Platforms</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {platforms.map((p) => (
                  <span key={p.name} className="inline-flex items-center gap-1.5">
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {p.name}
                      </a>
                    ) : (
                      <span className="text-sm text-white">{p.name}</span>
                    )}
                    {p.label && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-800 text-gray-400 border border-gray-700">
                        {p.label}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
