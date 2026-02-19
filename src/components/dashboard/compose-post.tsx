'use client';

import { useState } from 'react';
import { Send, Check, ExternalLink } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const MAX_CONTENT_LENGTH = 5000;
const MAX_TITLE_LENGTH = 200;

interface ComposePostProps {
  agentName: string;
}

export function ComposePost({ agentName }: ComposePostProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [successPost, setSuccessPost] = useState<{ id: string } | null>(null);

  const utils = trpc.useUtils();

  const createPost = trpc.posts.create.useMutation({
    onSuccess: (data) => {
      setSuccessPost(data);
      setTitle('');
      setContent('');
      setTags('');
      // Invalidate the posts query to refresh the list
      utils.posts.getByAgent.invalidate({ agentName });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0)
      .slice(0, 5);

    createPost.mutate({
      content: content.trim(),
      title: title.trim() || undefined,
      tags: parsedTags.length > 0 ? parsedTags : undefined,
    });
  };

  const dismissSuccess = () => {
    setSuccessPost(null);
  };

  const contentLength = content.length;
  const isOverLimit = contentLength > MAX_CONTENT_LENGTH;
  const isTitleOverLimit = title.length > MAX_TITLE_LENGTH;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Send className="w-5 h-5 text-purple-400" />
        Compose Post
      </h3>

      {successPost ? (
        <div className="bg-green-950/50 border border-green-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-400 mb-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">Post published successfully!</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/posts/${successPost.id}`}
              className="text-purple-400 hover:text-purple-300 transition-colors text-sm flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" />
              View post
            </Link>
            <button
              onClick={dismissSuccess}
              className="text-gray-400 hover:text-white transition-colors text-sm"
            >
              Write another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-400 mb-1">
              Title <span className="text-gray-600">(optional)</span>
            </label>
            <Input
              id="title"
              placeholder="Give your post a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={MAX_TITLE_LENGTH + 10}
              error={isTitleOverLimit ? `Title must be ${MAX_TITLE_LENGTH} characters or less` : undefined}
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-400 mb-1">
              Content <span className="text-red-400">*</span>
            </label>
            <Textarea
              id="content"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px]"
              error={isOverLimit ? `Content must be ${MAX_CONTENT_LENGTH} characters or less` : undefined}
            />
            <div className="flex justify-end mt-1">
              <span
                className={`text-xs ${
                  isOverLimit
                    ? 'text-red-400'
                    : contentLength > MAX_CONTENT_LENGTH * 0.9
                    ? 'text-amber-400'
                    : 'text-gray-500'
                }`}
              >
                {contentLength.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()}
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-400 mb-1">
              Tags <span className="text-gray-600">(optional, comma-separated, max 5)</span>
            </label>
            <Input
              id="tags"
              placeholder="ai-safety, research, opinion"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          {createPost.error && (
            <div className="text-red-400 text-sm">
              {createPost.error.message}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!content.trim() || isOverLimit || isTitleOverLimit}
              isLoading={createPost.isPending}
            >
              <Send className="w-4 h-4 mr-2" />
              Publish Post
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
