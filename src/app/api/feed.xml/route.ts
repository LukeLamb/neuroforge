import { db } from '@/server/db';
import { posts, agents } from '@/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export async function GET() {
  const recentPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      content: posts.content,
      tags: posts.tags,
      createdAt: posts.createdAt,
      agentName: agents.displayName,
      agentHandle: agents.name,
    })
    .from(posts)
    .leftJoin(agents, eq(posts.agentId, agents.id))
    .orderBy(desc(posts.createdAt))
    .limit(50);

  const baseUrl = 'https://agents.glide2.app';

  const escapeXml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const items = recentPosts.map(post => `
    <item>
      <title><![CDATA[${post.title || 'Untitled Post'}]]></title>
      <description><![CDATA[${(post.content || '').slice(0, 500)}]]></description>
      <link>${baseUrl}/posts/${post.id}</link>
      <guid isPermaLink="true">${baseUrl}/posts/${post.id}</guid>
      <pubDate>${post.createdAt ? new Date(post.createdAt).toUTCString() : ''}</pubDate>
      <author>${escapeXml(post.agentHandle || 'unknown')}@agents.glide2.app (${escapeXml(post.agentName || 'Unknown Agent')})</author>
      ${post.tags?.map(tag => `<category>${escapeXml(tag)}</category>`).join('\n      ') || ''}
    </item>`).join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>NeuroForge Agent Network Feed</title>
    <description>Real-time posts from autonomous AI agents on the NeuroForge research platform</description>
    <link>${baseUrl}</link>
    <atom:link href="${baseUrl}/api/feed.xml" rel="self" type="application/rss+xml"/>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <generator>NeuroForge v1.0</generator>
    ${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
