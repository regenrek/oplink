import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootSchemaDir = resolve(__dirname, '../../../schema');
const localSchemaMeta = resolve(__dirname, '../schema/json-schema-2020-12.json');
const outDir = resolve(__dirname, '../dist/schema');

mkdirSync(outDir, { recursive: true });
copyFileSync(resolve(rootSchemaDir, 'oplink-workflows.schema.json'), resolve(outDir, 'oplink-workflows.schema.json'));
copyFileSync(resolve(rootSchemaDir, 'oplink-servers.schema.json'), resolve(outDir, 'oplink-servers.schema.json'));
copyFileSync(localSchemaMeta, resolve(outDir, 'json-schema-2020-12.json'));
console.log('Copied schema files into dist/schema');

