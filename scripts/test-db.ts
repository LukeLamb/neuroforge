/**
 * Database Connection Test Script
 *
 * Run with: npm run db:test
 */

import 'dotenv/config';
import postgres from 'postgres';

async function testConnection() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('\nTo fix this:');
    console.log('1. Copy .env.example to .env.local');
    console.log('2. Update DATABASE_URL with your PostgreSQL connection string');
    console.log('3. Run this script again');
    process.exit(1);
  }

  console.log('🔌 Connecting to database...\n');

  const sql = postgres(connectionString);

  try {
    // Test 1: Basic connection
    const timeResult = await sql`SELECT NOW() as current_time`;
    console.log('✅ Database connected!');
    console.log(`   Current time: ${timeResult[0].current_time}\n`);

    // Test 2: Count tables
    const tableResult = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `;
    console.log(`✅ Tables found: ${tableResult.length}`);
    tableResult.forEach((row) => {
      console.log(`   - ${row.table_name}`);
    });
    console.log('');

    // Test 3: Check RLS status
    const rlsResult = await sql`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    const rlsEnabled = rlsResult.filter((r) => r.rowsecurity).length;
    console.log(`✅ Row Level Security enabled on ${rlsEnabled}/${rlsResult.length} tables`);

    if (rlsEnabled < rlsResult.length) {
      console.log('   ⚠️  Warning: Some tables do not have RLS enabled!');
      rlsResult
        .filter((r) => !r.rowsecurity)
        .forEach((r) => console.log(`      - ${r.tablename}`));
    }
    console.log('');

    // Test 4: Check indexes
    const indexResult = await sql`
      SELECT COUNT(*) as count
      FROM pg_indexes
      WHERE schemaname = 'public'
    `;
    console.log(`✅ Indexes created: ${indexResult[0].count}\n`);

    // Test 5: Check constraints
    const constraintResult = await sql`
      SELECT COUNT(*) as count
      FROM information_schema.table_constraints
      WHERE constraint_schema = 'public'
    `;
    console.log(`✅ Constraints created: ${constraintResult[0].count}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 All database tests passed!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

testConnection();
