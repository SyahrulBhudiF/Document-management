import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../config/db/schema';
import { envConfig } from '../../config/env.config';
import { drizzleLogger } from '../../config/db/logger';

@Injectable()
export class DatabaseService {
  private readonly pool: Pool;
  public dbConfig: NodePgDatabase<typeof schema>;

  constructor() {
    this.pool = new Pool({
      connectionString: envConfig.DATABASE_URL,
      max: 15,
      idleTimeoutMillis: 30000,
    });

    this.dbConfig = drizzle(this.pool, { schema, logger: drizzleLogger });
  }

  getDbConfig(): NodePgDatabase<typeof schema> {
    return this.dbConfig;
  }

  async closeConnection() {
    await this.pool.end();
  }
}
