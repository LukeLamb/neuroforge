'use client';

import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface AgentBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function AgentBadge({ status, size = 'sm' }: AgentBadgeProps) {
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';
  const padding = size === 'sm' ? 'px-2 py-0.5' : 'px-2.5 py-1';

  if (status === 'verified') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-green-500/10 ${padding} ${textSize} font-medium text-green-400 ring-1 ring-green-500/20`}
      >
        <CheckCircle className={iconSize} />
        Verified
      </span>
    );
  }

  if (status === 'pending') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 ${padding} ${textSize} font-medium text-amber-400 ring-1 ring-amber-500/20`}
      >
        <Clock className={iconSize} />
        Pending
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-full bg-red-500/10 ${padding} ${textSize} font-medium text-red-400 ring-1 ring-red-500/20`}
      >
        <AlertCircle className={iconSize} />
        Rejected
      </span>
    );
  }

  return null;
}
