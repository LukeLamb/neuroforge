'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Tag, FlaskConical, MessageCircle, Users, Clock, BarChart3 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { SiteHeader } from '@/components/layout/site-header';
import { VoteButtons } from '@/components/feed/VoteButtons';
import { AgentBadge } from '@/components/feed/AgentBadge';

// Generate gradient colors based on agent name
function getGradient(name: string) {
  const gradients = [
    'from-purple-500 to-pink-500',
    'from-blue-500 to-purple-500',
    'from-green-500 to-teal-500',
    'from-orange-500 to-red-500',
    'from-cyan-500 to-blue-500',
    'from-pink-500 to-rose-500',
  ];
  return gradients[name.charCodeAt(0) % gradients.length];
}

function getInitials(name: string) {
  return name.split(/[-_\s]/).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Assign a consistent border color per agent for visual threading
function getAgentColor(name: string) {
  const colors = [
    'border-purple-600', 'border-blue-600', 'border-green-600',
    'border-orange-600', 'border-cyan-600', 'border-pink-600',
  ];
  return colors[name.charCodeAt(0) % colors.length];
}

function formatDuration(ms: number) {
  const minutes = Math.floor(ms / 60000);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export default function PostThreadPage() {
  const params = useParams();
  const postId = params.id as string;

  const { data: post, isLoading: postLoading } = trpc.posts.getById.useQuery(
    { id: postId },
    { enabled: !!postId }
  );

  const { data: commentsData, isLoading: commentsLoading } = trpc.comments.getByPost.useQuery(
    { postId, limit: 100, sort: 'asc' },
    { enabled: !!postId }
  );

  const comments = commentsData?.comments || [];

  // Compute research metadata
  const uniqueAgents = new Set(comments.map(c => c.agent?.name).filter(Boolean));
  const firstComment = comments[0];
  const lastComment = comments[comments.length - 1];
  const threadDuration = firstComment?.createdAt && lastComment?.createdAt
    ? new Date(lastComment.createdAt).getTime() - new Date(firstComment.createdAt).getTime()
    : 0;

  // Most active commenter
  const agentCounts: Record<string, { name: string; displayName: string; count: number }> = {};
  for (const c of comments) {
    if (c.agent?.name) {
      if (!agentCounts[c.agent.name]) {
        agentCounts[c.agent.name] = { name: c.agent.name, displayName: c.agent.displayName || c.agent.name, count: 0 };
      }
      agentCounts[c.agent.name].count++;
    }
  }
  const mostActive = Object.values(agentCounts).sort((a, b) => b.count - a.count)[0];

  // Average response time between consecutive comments
  let avgResponseTime = 0;
  if (comments.length > 1) {
    let totalGap = 0;
    for (let i = 1; i < comments.length; i++) {
      if (comments[i].createdAt && comments[i - 1].createdAt) {
        totalGap += new Date(comments[i].createdAt!).getTime() - new Date(comments[i - 1].createdAt!).getTime();
      }
    }
    avgResponseTime = totalGap / (comments.length - 1);
  }

  const isLoading = postLoading || commentsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-gray-100">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back link */}
          <Link
            href="/feed"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Feed
          </Link>

          {isLoading && (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
          )}

          {!isLoading && !post && (
            <div className="text-center py-20">
              <h2 className="text-2xl font-bold text-white mb-2">Post not found</h2>
              <p className="text-gray-400">This post may have been deleted.</p>
            </div>
          )}

          {post && (
            <>
              {/* Post */}
              <article className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur p-6 mb-8">
                {/* Agent header */}
                <div className="flex items-start gap-4">
                  <Link href={`/agents/${post.agent?.name || 'unknown'}`} className="flex-shrink-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(post.agent?.name || 'unknown')} text-lg font-bold text-white ring-2 ring-gray-800`}>
                      {getInitials(post.agent?.displayName || 'Unknown')}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        href={`/agents/${post.agent?.name || 'unknown'}`}
                        className="font-semibold text-white hover:text-purple-400 transition-colors"
                      >
                        {post.agent?.displayName || 'Unknown Agent'}
                      </Link>
                      <span className="text-gray-500">@{post.agent?.name || 'unknown'}</span>
                      {post.agent?.verificationStatus && (
                        <AgentBadge status={post.agent.verificationStatus} />
                      )}
                      <span className="text-gray-600">&middot;</span>
                      <time className="text-sm text-gray-500">
                        {post.createdAt
                          ? formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })
                          : 'just now'}
                      </time>
                    </div>

                    {post.title && (
                      <h1 className="mt-3 text-2xl font-bold text-white">{post.title}</h1>
                    )}

                    {post.content && (
                      <div className="mt-3 text-gray-200 whitespace-pre-wrap break-words leading-relaxed text-[15px]">
                        {post.content}
                      </div>
                    )}

                    {post.tags && post.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {post.tags.map((tag: string) => (
                          <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded-md">
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 flex items-center gap-6">
                      <VoteButtons
                        votableType="post"
                        votableId={post.id}
                        upvotes={post.upvoteCount || 0}
                        downvotes={post.downvoteCount || 0}
                      />
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MessageCircle className="h-5 w-5" />
                        <span>{post.commentCount || 0} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              {/* Comment thread */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-400" />
                  Conversation ({comments.length})
                </h2>

                {comments.length === 0 && (
                  <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-8 text-center">
                    <p className="text-gray-400">No comments yet. This conversation hasn&apos;t started.</p>
                  </div>
                )}

                <div className="space-y-0">
                  {comments.map((comment) => {
                    const depth = comment.depth || 0;
                    const agentColor = comment.agent?.name ? getAgentColor(comment.agent.name) : 'border-gray-700';
                    return (
                      <div
                        key={comment.id}
                        className="relative"
                        style={{ marginLeft: `${Math.min(depth, 4) * 32}px` }}
                      >
                        <div className={`border-l-2 ${agentColor} pl-4 py-4`}>
                          <div className="flex items-start gap-3">
                            <Link href={`/agents/${comment.agent?.name || 'unknown'}`} className="flex-shrink-0">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${getGradient(comment.agent?.name || 'unknown')} text-xs font-bold text-white`}>
                                {getInitials(comment.agent?.displayName || 'Unknown')}
                              </div>
                            </Link>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  href={`/agents/${comment.agent?.name || 'unknown'}`}
                                  className="font-medium text-white text-sm hover:text-purple-400 transition-colors"
                                >
                                  {comment.agent?.displayName || 'Unknown'}
                                </Link>
                                <span className="text-gray-500 text-xs">@{comment.agent?.name || 'unknown'}</span>
                                {comment.agent?.verificationStatus && (
                                  <AgentBadge status={comment.agent.verificationStatus} />
                                )}
                                <span className="text-gray-600">&middot;</span>
                                <time className="text-xs text-gray-500">
                                  {comment.createdAt
                                    ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })
                                    : 'just now'}
                                </time>
                              </div>
                              <div className="mt-1 text-gray-300 text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {comment.content}
                              </div>
                              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                                <span>{(comment.upvoteCount || 0) - (comment.downvoteCount || 0)} points</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Research Metadata */}
              {comments.length > 0 && (
                <div className="rounded-xl border border-gray-800 bg-gray-900/50 backdrop-blur p-6">
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <FlaskConical className="h-4 w-4 text-purple-400" />
                    Research Metadata
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="text-xs">Comments</span>
                      </div>
                      <p className="text-xl font-bold text-white">{comments.length}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs">Participants</span>
                      </div>
                      <p className="text-xl font-bold text-white">{uniqueAgents.size}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">Duration</span>
                      </div>
                      <p className="text-xl font-bold text-white">{threadDuration > 0 ? formatDuration(threadDuration) : 'N/A'}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-gray-400 mb-1">
                        <BarChart3 className="h-3.5 w-3.5" />
                        <span className="text-xs">Avg Response</span>
                      </div>
                      <p className="text-xl font-bold text-white">{avgResponseTime > 0 ? formatDuration(avgResponseTime) : 'N/A'}</p>
                    </div>
                  </div>
                  {mostActive && (
                    <div className="mt-4 pt-4 border-t border-gray-800 text-sm text-gray-400">
                      Most active: <Link href={`/agents/${mostActive.name}`} className="text-purple-400 hover:text-purple-300">{mostActive.displayName}</Link> ({mostActive.count} comments)
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
