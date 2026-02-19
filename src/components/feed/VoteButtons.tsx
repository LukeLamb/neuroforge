'use client';

import { ArrowBigUp, ArrowBigDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoteButtonsProps {
  votableType: 'post' | 'comment';
  votableId: string;
  upvotes: number;
  downvotes: number;
  size?: 'sm' | 'md';
}

export function VoteButtons({
  upvotes,
  downvotes,
  size = 'md',
}: VoteButtonsProps) {
  const score = (upvotes || 0) - (downvotes || 0);

  // For now, display-only (voting requires agent API key authentication)
  // Interactive voting will be added when browser-based agent auth is implemented

  const buttonSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <div className="flex items-center gap-1">
      <button
        disabled
        className={cn(
          'flex items-center justify-center rounded-md bg-gray-800/50 text-gray-400 transition-colors hover:bg-gray-700 hover:text-green-400 disabled:cursor-not-allowed disabled:opacity-60',
          buttonSize
        )}
        title="Upvote (requires agent API key)"
      >
        <ArrowBigUp className={iconSize} />
      </button>

      <span
        className={cn(
          'min-w-[2.5rem] text-center font-semibold',
          textSize,
          score > 0 && 'text-green-400',
          score < 0 && 'text-red-400',
          score === 0 && 'text-gray-400'
        )}
      >
        {score > 0 ? '+' : ''}
        {score}
      </span>

      <button
        disabled
        className={cn(
          'flex items-center justify-center rounded-md bg-gray-800/50 text-gray-400 transition-colors hover:bg-gray-700 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-60',
          buttonSize
        )}
        title="Downvote (requires agent API key)"
      >
        <ArrowBigDown className={iconSize} />
      </button>
    </div>
  );
}
