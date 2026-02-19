/**
 * Environment Variables Test Script
 *
 * Verifies all required environment variables are set correctly.
 * Run with: npm run test:env
 */

import 'dotenv/config';

console.log('🔍 Testing Environment Variables...\n');

interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
}

const envChecks: EnvCheck[] = [
  // Database
  { key: 'DATABASE_URL', required: true, description: 'PostgreSQL connection string' },
  { key: 'DIRECT_URL', required: true, description: 'Direct PostgreSQL connection' },

  // Upstash Redis
  { key: 'UPSTASH_REDIS_REST_URL', required: true, description: 'Upstash Redis REST URL' },
  { key: 'UPSTASH_REDIS_REST_TOKEN', required: true, description: 'Upstash Redis REST token' },

  // NextAuth
  { key: 'NEXTAUTH_SECRET', required: true, description: 'NextAuth encryption secret' },
  { key: 'NEXTAUTH_URL', required: true, description: 'NextAuth base URL' },

  // Optional
  { key: 'REDIS_URL', required: false, description: 'Local Redis URL (optional)' },
  { key: 'GITHUB_CLIENT_ID', required: false, description: 'GitHub OAuth client ID' },
  { key: 'GITHUB_CLIENT_SECRET', required: false, description: 'GitHub OAuth client secret' },
  { key: 'TWITTER_CLIENT_ID', required: false, description: 'Twitter OAuth client ID' },
  { key: 'TWITTER_CLIENT_SECRET', required: false, description: 'Twitter OAuth client secret' },
];

let requiredMissing = 0;
let optionalMissing = 0;

console.log('Required Variables:\n');

for (const check of envChecks.filter(c => c.required)) {
  const value = process.env[check.key];
  const isPlaceholder = value?.includes('placeholder') || value?.includes('GENERATE');

  if (!value || isPlaceholder) {
    console.log(`  ❌ ${check.key}`);
    console.log(`     ${check.description}`);
    requiredMissing++;
  } else {
    // Mask sensitive values
    const masked = value.length > 20
      ? value.substring(0, 15) + '...' + value.substring(value.length - 5)
      : value.substring(0, 10) + '...';
    console.log(`  ✅ ${check.key}: ${masked}`);
  }
}

console.log('\nOptional Variables:\n');

for (const check of envChecks.filter(c => !c.required)) {
  const value = process.env[check.key];

  if (!value) {
    console.log(`  ⚪ ${check.key}: Not set (optional)`);
    optionalMissing++;
  } else {
    const masked = value.length > 20
      ? value.substring(0, 15) + '...'
      : value.substring(0, 10) + '...';
    console.log(`  ✅ ${check.key}: ${masked}`);
  }
}

console.log('\n' + '━'.repeat(50));

if (requiredMissing === 0) {
  console.log('🎉 All required environment variables are set!');
  if (optionalMissing > 0) {
    console.log(`ℹ️  ${optionalMissing} optional variable(s) not configured yet.`);
  }
  console.log('━'.repeat(50) + '\n');
  process.exit(0);
} else {
  console.log(`⚠️  ${requiredMissing} required variable(s) missing!`);
  console.log('Please update .env.local with the missing values.');
  console.log('━'.repeat(50) + '\n');
  process.exit(1);
}
