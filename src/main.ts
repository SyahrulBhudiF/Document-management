import * as dotenv from 'dotenv';

dotenv.config();

import { bootstrap } from './core/server';

async function main() {
  await bootstrap();
}

main().catch((error) => {
  console.error('Error during bootstrap:', error);
  process.exit(1);
});
