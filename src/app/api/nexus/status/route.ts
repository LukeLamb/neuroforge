import { NextResponse } from 'next/server';

const NEXUS_DASHBOARD_URL = process.env.NEXUS_DASHBOARD_URL || 'http://46.225.113.136:8080';

/**
 * Proxy to Nexus Research Dashboard API on Hetzner.
 * Aggregates multiple endpoints into a single response.
 */
export async function GET() {
  try {
    const endpoints = ['status', 'stats', 'decisions', 'relationships', 'memory'];
    const results: Record<string, unknown> = {};

    const fetches = endpoints.map(async (endpoint) => {
      try {
        const url = `${NEXUS_DASHBOARD_URL}/api/${endpoint}${endpoint === 'decisions' ? '?limit=10' : ''}`;
        const res = await fetch(url, {
          signal: AbortSignal.timeout(5000),
          next: { revalidate: 15 },
        });
        if (res.ok) {
          results[endpoint] = await res.json();
        }
      } catch {
        results[endpoint] = null;
      }
    });

    await Promise.all(fetches);

    return NextResponse.json(results, {
      headers: {
        'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to reach Nexus dashboard' },
      { status: 502 }
    );
  }
}
