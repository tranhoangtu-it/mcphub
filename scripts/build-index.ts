/**
 * build-index.ts
 * Reads all YAML files from registry/servers/ and registry/bundles/,
 * generates a combined registry/index.json for CLI and website consumption.
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const SERVERS_DIR = path.join(ROOT, "registry", "servers");
const BUNDLES_DIR = path.join(ROOT, "registry", "bundles");
const OUTPUT_PATH = path.join(ROOT, "registry", "index.json");

interface ServerEntry {
	name: string;
	package: string;
	source?: string;
	description: string;
	category: string;
	tags?: string[];
	author?: string;
	verified?: boolean;
	config: { command: string; args: string[]; env?: Record<string, string> };
	clients?: Record<string, { command?: string; args?: string[]; env?: Record<string, string> }>;
	links?: { repo?: string; docs?: string; homepage?: string };
}

interface BundleEntry {
	name: string;
	description: string;
	category?: string;
	servers: string[];
}

interface RegistryIndex {
	version: string;
	generated: string;
	stats: { servers: number; bundles: number; categories: string[] };
	servers: Record<string, ServerEntry>;
	bundles: Record<string, BundleEntry>;
}

/** Get all .yaml files from a directory */
function getYamlFiles(dir: string): string[] {
	if (!fs.existsSync(dir)) return [];
	return fs
		.readdirSync(dir)
		.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
		.map((f) => path.join(dir, f));
}

function main(): void {
	const servers: Record<string, ServerEntry> = {};
	const bundles: Record<string, BundleEntry> = {};
	const categories = new Set<string>();

	// Load servers
	for (const file of getYamlFiles(SERVERS_DIR)) {
		const data = YAML.parse(fs.readFileSync(file, "utf-8")) as ServerEntry;
		servers[data.name] = data;
		categories.add(data.category);
	}

	// Load bundles
	for (const file of getYamlFiles(BUNDLES_DIR)) {
		const data = YAML.parse(fs.readFileSync(file, "utf-8")) as BundleEntry;
		bundles[data.name] = data;
	}

	const index: RegistryIndex = {
		version: "1.0.0",
		generated: new Date().toISOString(),
		stats: {
			servers: Object.keys(servers).length,
			bundles: Object.keys(bundles).length,
			categories: [...categories].sort(),
		},
		servers,
		bundles,
	};

	fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
	fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index, null, 2));

	console.log(`\n  Index Built\n`);
	console.log(`  Servers: ${index.stats.servers}`);
	console.log(`  Bundles: ${index.stats.bundles}`);
	console.log(`  Categories: ${index.stats.categories.join(", ")}`);
	console.log(`  Output: ${path.relative(ROOT, OUTPUT_PATH)}\n`);
}

main();
