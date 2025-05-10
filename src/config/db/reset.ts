import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { reset } from 'drizzle-seed';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool, { schema });

async function main() {
  console.log('⚠️ Resetting database using drizzle reset...');
  await reset(db, schema);
  console.log('✅ Database reset complete.');
  await pool.end();
}

main().catch((err) => {
  console.error('❌ Error during reset:', err);
});
