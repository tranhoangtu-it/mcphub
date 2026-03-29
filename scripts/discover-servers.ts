/**
 * discover-servers.ts
 * Crawls npm registry for MCP server packages.
 * Scores them by quality metrics and outputs discovered/index.json.
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const SERVERS_DIR = path.join(ROOT, "registry", "servers");
const DISCOVERED_DIR = path.join(ROOT, "registry", "discovered");
const OUTPUT_PATH = path.join(DISCOVERED_DIR, "index.json");

interface NpmSearchResult {
	objects: Array<{
		package: {
			name: string;
			description?: string;
			keywords?: string[];
			date: string;
			version: string;
			publisher?: { username: string };
			links?: { npm?: string; repository?: string; homepage?: string };
		};
		score: { final: number; detail: { quality: number; popularity: number; maintenance: number } };
		downloads?: { monthly: number; weekly: number };
	}>;
	total: number;
}

interface DiscoveredServer {
	name: string;
	package: string;
	description: string;
	category: string;
	tags: string[];
	author: string;
	score: number;
	tier: "recommended" | "community" | "low";
	npmWeeklyDownloads: number;
	lastPublish: string;
	version: string;
	links: { npm?: string; repo?: string; homepage?: string };
}

/** Get curated server package names to exclude from discovery */
function getCuratedPackages(): Set<string> {
	const packages = new Set<string>();
	if (!fs.existsSync(SERVERS_DIR)) return packages;
	for (const file of fs.readdirSync(SERVERS_DIR).filter((f) => f.endsWith(".yaml"))) {
		const data = YAML.parse(fs.readFileSync(path.join(SERVERS_DIR, file), "utf-8"));
		if (data?.package) packages.add(data.package);
	}
	return packages;
}

/** Search npm for MCP-related packages */
async function searchNpm(query: string, size = 250): Promise<NpmSearchResult> {
	const url = `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(query)}&size=${size}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`npm search failed: ${res.status}`);
	return (await res.json()) as NpmSearchResult;
}

/** Categorize package by keywords/name heuristics */
function guessCategory(name: string, keywords: string[], description: string): string {
	const all = [...keywords, name, description].join(" ").toLowerCase();
	if (/database|sql|postgres|mongo|redis/.test(all)) return "database";
	if (/docker|k8s|kubernetes|deploy|ci|cd/.test(all)) return "devops";
	if (/aws|gcp|azure|cloud/.test(all)) return "cloud";
	if (/slack|discord|email|chat/.test(all)) return "communication";
	if (/git|code|dev|file|editor/.test(all)) return "developer-tools";
	if (/browser|web|http|scrape|fetch/.test(all)) return "web";
	if (/ai|llm|model|openai|agent/.test(all)) return "ai";
	if (/figma|design|ui|css/.test(all)) return "design";
	if (/jira|notion|linear|project/.test(all)) return "productivity";
	if (/sentry|log|metric|monitor/.test(all)) return "analytics";
	if (/auth|security|encrypt|vault/.test(all)) return "security";
	return "other";
}

/** Calculate quality score (0-100) from npm search data */
function calculateScore(obj: NpmSearchResult["objects"][0]): number {
	const { score, downloads } = obj;
	// npm search score components (already 0-1)
	const popularity = (score.detail.popularity ?? 0) * 30;
	const quality = (score.detail.quality ?? 0) * 25;
	const maintenance = (score.detail.maintenance ?? 0) * 25;

	// Downloads bonus (log scale)
	const weekly = downloads?.weekly ?? 0;
	let downloadScore = 0;
	if (weekly > 10000) downloadScore = 20;
	else if (weekly > 1000) downloadScore = 15;
	else if (weekly > 100) downloadScore = 10;
	else if (weekly > 10) downloadScore = 5;

	return Math.round(popularity + quality + maintenance + downloadScore);
}

/** Determine tier from score */
function getTier(score: number): "recommended" | "community" | "low" {
	if (score >= 70) return "recommended";
	if (score >= 40) return "community";
	return "low";
}

async function main(): Promise<void> {
	console.log("\n  MCP Server Discovery\n");

	const curatedPackages = getCuratedPackages();
	console.log(`  Curated packages to exclude: ${curatedPackages.size}`);

	// Search npm for MCP server packages using multiple queries
	const queries = ["mcp-server", "mcp server", "modelcontextprotocol"];
	const allPackages = new Map<string, NpmSearchResult["objects"][0]>();

	for (const query of queries) {
		console.log(`  Searching npm: "${query}"...`);
		try {
			const results = await searchNpm(query);
			for (const obj of results.objects) {
				if (!allPackages.has(obj.package.name)) {
					allPackages.set(obj.package.name, obj);
				}
			}
		} catch (err) {
			console.log(`    Warning: search failed for "${query}": ${err}`);
		}
	}

	console.log(`  Total unique packages found: ${allPackages.size}`);

	// Filter: must have "mcp" in name or keywords, exclude curated
	const discovered: DiscoveredServer[] = [];
	for (const [, obj] of allPackages) {
		const { name, keywords = [], description = "" } = obj.package;
		const allText = [name, ...keywords, description].join(" ").toLowerCase();

		// Must be MCP-related
		if (!allText.includes("mcp") && !allText.includes("model context protocol")) continue;

		// Exclude curated packages
		if (curatedPackages.has(name)) continue;

		// Exclude SDK/tooling packages (not servers)
		if (/\b(sdk|cli|client|inspector|starter|template)\b/.test(name)) continue;

		const score = calculateScore(obj);
		const kebabName = name.replace(/^@[^/]+\//, "").replace(/[^a-z0-9-]/g, "-");

		discovered.push({
			name: kebabName,
			package: name,
			description: description.slice(0, 200),
			category: guessCategory(name, keywords, description),
			tags: keywords.slice(0, 5),
			author: obj.package.publisher?.username ?? "unknown",
			score,
			tier: getTier(score),
			npmWeeklyDownloads: obj.downloads?.weekly ?? 0,
			lastPublish: obj.package.date,
			version: obj.package.version,
			links: {
				npm: obj.package.links?.npm,
				repo: obj.package.links?.repository,
				homepage: obj.package.links?.homepage,
			},
		});
	}

	// Sort by score descending
	discovered.sort((a, b) => b.score - a.score);

	// Write output
	fs.mkdirSync(DISCOVERED_DIR, { recursive: true });
	const output = {
		version: "1.0.0",
		generated: new Date().toISOString(),
		stats: {
			total: discovered.length,
			recommended: discovered.filter((s) => s.tier === "recommended").length,
			community: discovered.filter((s) => s.tier === "community").length,
		},
		servers: discovered,
	};
	fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));

	console.log(`\n  Discovered: ${discovered.length} servers`);
	console.log(`  Recommended: ${output.stats.recommended}`);
	console.log(`  Community: ${output.stats.community}`);
	console.log(`  Output: ${path.relative(ROOT, OUTPUT_PATH)}\n`);

	// Show top 10
	if (discovered.length > 0) {
		console.log("  Top 10:");
		for (const s of discovered.slice(0, 10)) {
			console.log(`    ${s.score.toString().padStart(3)} ${s.tier.padEnd(12)} ${s.package}`);
		}
		console.log();
	}
}

main();
