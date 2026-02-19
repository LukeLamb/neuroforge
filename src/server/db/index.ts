import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Database connection
 *
 * Uses postgres.js driver with Drizzle ORM
 * Connection string should be set in DATABASE_URL env var
 *
 * Note: During build time, DATABASE_URL might not be set.
 * We handle this gracefully to allow builds to succeed.
 */

const connectionString = process.env.DATABASE_URL;

// Create a lazy-loaded database connection
// This prevents errors during build time when DATABASE_URL is not set
function createDb() {
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure your database connection in .env.local'
    );
  }

  const queryClient = postgres(connectionString, {
    max: 10, // Maximum connections in pool
    idle_timeout: 20, // Close idle connections after 20 seconds
    connect_timeout: 10, // Connection timeout in seconds
  });

  return drizzle(queryClient, { schema });
}

// Lazy initialization - only create connection when actually needed
let _db: ReturnType<typeof createDb> | null = null;

export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    if (!_db) {
      _db = createDb();
    }
    return (_db as any)[prop];
  },
});

// Export schema for use in queries
export { schema };
