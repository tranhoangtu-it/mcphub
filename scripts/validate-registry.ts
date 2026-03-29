/**
 * validate-registry.ts
 * Validates all YAML files in registry/servers/ and registry/bundles/
 * against their respective JSON schemas.
 * Also cross-references bundle server entries against existing server files.
 */

import fs from "node:fs";
import path from "node:path";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import YAML from "yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const SERVERS_DIR = path.join(ROOT, "registry", "servers");
const BUNDLES_DIR = path.join(ROOT, "registry", "bundles");
const SERVER_SCHEMA_PATH = path.join(ROOT, "schema", "server.schema.json");
const BUNDLE_SCHEMA_PATH = path.join(ROOT, "schema", "bundle.schema.json");

// Setup AJV validator with format support
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

/** Read and parse a YAML file */
function readYaml(filePath: string): unknown {
	const content = fs.readFileSync(filePath, "utf-8");
	return YAML.parse(content);
}

/** Get all .yaml files from a directory */
function getYamlFiles(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
		.map((f) => path.join(dir, f));
}

interface ValidationResult {
	file: string;
	valid: boolean;
	errors: string[];
}

function main(): void {
	const results: ValidationResult[] = [];
	let hasErrors = false;

	// Load schemas
	const serverSchema = JSON.parse(fs.readFileSync(SERVER_SCHEMA_PATH, "utf-8"));
	const bundleSchema = JSON.parse(fs.readFileSync(BUNDLE_SCHEMA_PATH, "utf-8"));
	const validateServer = ajv.compile(serverSchema);
	const validateBundle = ajv.compile(bundleSchema);

	// Validate server YAML files
	const serverFiles = getYamlFiles(SERVERS_DIR);
	const serverNames = new Set<string>();

	for (const file of serverFiles) {
		const result: ValidationResult = { file: path.relative(ROOT, file), valid: true, errors: [] };
		try {
			const data = readYaml(file);
			if (!validateServer(data)) {
				result.valid = false;
				for (const err of validateServer.errors ?? []) {
					result.errors.push(`${err.instancePath} ${err.message}`);
				}
			} else {
				const server = data as { name: string };
				// Check filename matches server name
				const expectedFile = `${server.name}.yaml`;
				const actualFile = path.basename(file);
				if (actualFile !== expectedFile) {
					result.valid = false;
					result.errors.push(
						`Filename "${actualFile}" must match server name "${server.name}.yaml"`,
					);
				}
				serverNames.add(server.name);
			}
		} catch (err) {
			result.valid = false;
			result.errors.push(`Parse error: ${String(err)}`);
		}
		results.push(result);
		if (!result.valid) hasErrors = true;
	}

	// Validate bundle YAML files
	const bundleFiles = getYamlFiles(BUNDLES_DIR);

	for (const file of bundleFiles) {
		const result: ValidationResult = { file: path.relative(ROOT, file), valid: true, errors: [] };
		try {
			const data = readYaml(file);
			if (!validateBundle(data)) {
				result.valid = false;
				for (const err of validateBundle.errors ?? []) {
					result.errors.push(`${err.instancePath} ${err.message}`);
				}
			} else {
				const bundle = data as { name: string; servers: string[] };
				// Check filename matches bundle name
				const expectedFile = `${bundle.name}.yaml`;
				const actualFile = path.basename(file);
				if (actualFile !== expectedFile) {
					result.valid = false;
					result.errors.push(
						`Filename "${actualFile}" must match bundle name "${bundle.name}.yaml"`,
					);
				}
				// Cross-reference: bundle servers must exist in registry/servers/
				for (const server of bundle.servers) {
					if (!serverNames.has(server)) {
						result.valid = false;
						result.errors.push(
							`Server "${server}" referenced in bundle but not found in registry/servers/`,
						);
					}
				}
			}
		} catch (err) {
			result.valid = false;
			result.errors.push(`Parse error: ${String(err)}`);
		}
		results.push(result);
		if (!result.valid) hasErrors = true;
	}

	// Report results
	console.log(`\n  Registry Validation\n`);
	console.log(`  Servers: ${serverFiles.length} files`);
	console.log(`  Bundles: ${bundleFiles.length} files\n`);

	for (const r of results) {
		if (r.valid) {
			console.log(`  ✓ ${r.file}`);
		} else {
			console.log(`  ✗ ${r.file}`);
			for (const err of r.errors) {
				console.log(`    → ${err}`);
			}
		}
	}

	if (results.length === 0) {
		console.log("  (no files to validate)");
	}

	console.log();

	if (hasErrors) {
		console.error("  Validation failed.\n");
		process.exit(1);
	}
	console.log("  All valid.\n");
}

main();
