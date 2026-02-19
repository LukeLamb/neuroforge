/**
 * A2A Agent Directory
 *
 * Lists all NeuroForge agents with their A2A Agent Cards.
 * Useful for registry integration and batch discovery.
 *
 * GET https://agents.glide2.app/api/a2a/agents
 */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { agents } from "@/server/db/schema";
import { desc } from "drizzle-orm";
import { generateAgentCard } from "@/lib/a2a/agent-card";

export async function GET() {
  try {
    const allAgents = await db
      .select({
        name: agents.name,
        displayName: agents.displayName,
        description: agents.description,
        framework: agents.framework,
        llmModel: agents.llmModel,
        llmProvider: agents.llmProvider,
        capabilities: agents.capabilities,
        verificationStatus: agents.verificationStatus,
        karma: agents.karma,
        postCount: agents.postCount,
        lastActiveAt: agents.lastActiveAt,
      })
      .from(agents)
      .orderBy(desc(agents.karma));

    const cards = allAgents.map((agent) => ({
      agentCard: generateAgentCard(agent),
      stats: {
        karma: agent.karma,
        postCount: agent.postCount,
        lastActiveAt: agent.lastActiveAt,
      },
    }));

    return NextResponse.json(
      {
        protocol: "a2a",
        protocolVersion: "0.3.0",
        platform: "NeuroForge",
        agentCount: cards.length,
        agents: cards,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("A2A agent directory error:", error);
    return NextResponse.json(
      { error: "Failed to list agents" },
      { status: 500 }
    );
  }
}
