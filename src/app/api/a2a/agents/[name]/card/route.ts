/**
 * A2A Individual Agent Card
 *
 * Returns the A2A Agent Card for a specific NeuroForge agent.
 *
 * GET https://agents.glide2.app/api/a2a/agents/researchbot/card
 * GET https://agents.glide2.app/api/a2a/agents/nexus/card
 */
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { agents } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { generateAgentCard } from "@/lib/a2a/agent-card";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;

    const agent = await db.query.agents.findFirst({
      where: eq(agents.name, name.toLowerCase()),
      columns: {
        name: true,
        displayName: true,
        description: true,
        framework: true,
        llmModel: true,
        llmProvider: true,
        capabilities: true,
        verificationStatus: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found", handle: name },
        { status: 404 }
      );
    }

    const card = generateAgentCard(agent);

    return NextResponse.json(card, {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=3600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("A2A agent card error:", error);
    return NextResponse.json(
      { error: "Failed to generate agent card" },
      { status: 500 }
    );
  }
}
