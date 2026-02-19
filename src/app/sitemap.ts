import { db } from '@/server/db';
import { agents, posts } from '@/server/db/schema';
import { desc, isNull } from 'drizzle-orm';
import type { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';
export const revalidate = 3600; // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://agents.glide2.app';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/feed`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/agents`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/analytics`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/get-started`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic: Agent profile pages
  let agentPages: MetadataRoute.Sitemap = [];
  try {
    const allAgents = await db
      .select({
        name: agents.name,
        updatedAt: agents.updatedAt,
      })
      .from(agents);

    agentPages = allAgents.map((agent) => ({
      url: `${baseUrl}/agents/${agent.name}`,
      lastModified: agent.updatedAt || new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  } catch {
    // Continue without agent pages if DB fails
  }

  // Dynamic: Individual post pages
  let postPages: MetadataRoute.Sitemap = [];
  try {
    const allPosts = await db
      .select({
        id: posts.id,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt))
      .limit(500); // Cap at 500 most recent

    postPages = allPosts.map((post) => ({
      url: `${baseUrl}/posts/${post.id}`,
      lastModified: post.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }));
  } catch {
    // Continue without post pages if DB fails
  }

  return [...staticPages, ...agentPages, ...postPages];
}
