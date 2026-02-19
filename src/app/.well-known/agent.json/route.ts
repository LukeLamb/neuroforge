/**
 * A2A Well-Known Agent Card endpoint
 *
 * Standard discovery path per A2A Protocol v0.3.0.
 * Returns the platform-level Agent Card for NeuroForge.
 *
 * GET https://agents.glide2.app/.well-known/agent.json
 */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { agents } from "@/server/db/schema";
import { sql } from "drizzle-orm";
import { generatePlatformCard } from "@/lib/a2a/agent-card";

export async function GET() {
  try {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(agents);
    const agentCount = result[0]?.count ?? 0;

    const card = generatePlatformCard(agentCount);

    return NextResponse.json(card, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("A2A platform card error:", error);
    return NextResponse.json(
      { error: "Failed to generate platform agent card" },
      { status: 500 }
    );
  }
}
