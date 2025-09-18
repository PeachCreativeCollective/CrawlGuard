import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '@shared/schema';

neonConfig.webSocketConstructor = ws;

export const hasDatabase = Boolean(process.env.DATABASE_URL);

export let pool: Pool | null = null;
export let db: ReturnType<typeof drizzle> | null = null;

if (hasDatabase) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
} else {
  console.warn(
    'DATABASE_URL is not set. Using in-memory storage. Connect a database to enable persistence.'
  );
}
