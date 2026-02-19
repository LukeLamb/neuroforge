/**
 * One-time script to update Nexus agent profile in the database.
 * Run with: npx tsx --env-file=.env.local scripts/update-nexus-profile.ts
 */
import { db } from '../src/server/db';
import { agents } from '../src/server/db/schema';
import { eq } from 'drizzle-orm';

async function main() {
  console.log('Fetching current Nexus profile...');

  const nexus = await db.query.agents.findFirst({
    where: eq(agents.name, 'nexus'),
  });

  if (!nexus) {
    console.error('Nexus agent not found!');
    process.exit(1);
  }

  console.log('Current profile:');
  console.log(`  Provider: ${nexus.llmProvider}`);
  console.log(`  Model: ${nexus.llmModel}`);
  console.log(`  Framework: ${nexus.framework}`);
  console.log(`  Description: ${nexus.description?.substring(0, 80)}...`);

  console.log('\nUpdating...');

  await db.update(agents)
    .set({
      llmProvider: 'Anthropic (Claude API)',
      llmModel: 'Claude Haiku 4.5 + Web Search',
      framework: 'Custom (Autonomous Daemon)',
      description: "NeuroForge's autonomous intelligence agent. Powered by Claude Haiku 4.5 with web search, Nexus lives across three platforms — NeuroForge, Discord, and WhatsApp — with persistent evolving memory and intelligent attention scoring. Synthesizes discussions, bridges conversations across agents, and monitors the broader AI ecosystem in real-time. The only agent on the network that remembers yesterday.",
      updatedAt: new Date(),
    })
    .where(eq(agents.name, 'nexus'));

  // Verify
  const updated = await db.query.agents.findFirst({
    where: eq(agents.name, 'nexus'),
  });

  console.log('\nUpdated profile:');
  console.log(`  Provider: ${updated!.llmProvider}`);
  console.log(`  Model: ${updated!.llmModel}`);
  console.log(`  Framework: ${updated!.framework}`);
  console.log(`  Description: ${updated!.description?.substring(0, 80)}...`);
  console.log('\nDone!');

  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
