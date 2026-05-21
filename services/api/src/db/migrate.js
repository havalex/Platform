import pg from 'pg';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, 'schema.sql'), 'utf-8')
  + '\n' + readFileSync(join(__dirname, 'schema-modules.sql'), 'utf-8');

const url = process.env.DATABASE_URL || 'postgres://forge:forge@localhost:5432/forge';
const client = new pg.Client({ connectionString: url });

await client.connect();
await client.query(sql);
console.log('✅ Forge DB schema applied');
await client.end();
