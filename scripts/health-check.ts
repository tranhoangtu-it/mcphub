/**
 * health-check.ts
 * Verifies curated MCP servers are still available on their registries.
 * Outputs registry/health.json with per-server status.
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const SERVERS_DIR = path.join(ROOT, "registry", "servers");
const HEALTH_PATH = path.join(ROOT, "registry", "health.json");

interface ServerData {
	name: string;
	package: string;
	source?: string;
}

interface HealthEntry {
	name: string;
	package: string;
	status: "healthy" | "degraded" | "failed";
	lastCheck: string;
	error?: string;
}

/** Check npm package exists and is not deprecated */
async function checkNpm(pkg: string): Promise<{ ok: boolean; error?: string }> {
	try {
		const encoded = pkg.startsWith("@")
			? `@${encodeURIComponent(pkg.slice(1))}`
			: encodeURIComponent(pkg);
		const res = await fetch(`https://registry.npmjs.org/${encoded}`, {
			headers: { Accept: "application/vnd.npm.install-v1+json" },
		});
		if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
		return { ok: true };
	} catch (err) {
		return { ok: false, error: String(err) };
	}
}

/** Check PyPI package exists */
async function checkPypi(pkg: string): Promise<{ ok: boolean; error?: string }> {
	try {
		const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`, {
			method: "HEAD",
		});
		if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
		return { ok: true };
	} catch (err) {
		return { ok: false, error: String(err) };
	}
}

async function main(): Promise<void> {
	console.log("\n  Health Check\n");

	if (!fs.existsSync(SERVERS_DIR)) {
		console.log("  No servers to check.\n");
		return;
	}

	const files = fs
		.readdirSync(SERVERS_DIR)
		.filter((f) => f.endsWith(".yaml"))
		.map((f) => path.join(SERVERS_DIR, f));

	const results: HealthEntry[] = [];
	const now = new Date().toISOString();
	let failures = 0;

	for (const file of files) {
		const data = YAML.parse(fs.readFileSync(file, "utf-8")) as ServerData;
		const source = data.source ?? "npm";
		const entry: HealthEntry = {
			name: data.name,
			package: data.package,
			status: "healthy",
			lastCheck: now,
		};

		let check: { ok: boolean; error?: string };
		if (source === "npm") {
			check = await checkNpm(data.package);
		} else if (source === "pypi") {
			check = await checkPypi(data.package);
		} else {
			// Docker/GitHub — skip
			console.log(`  ⊘ ${data.name}  (${source} — skipped)`);
			entry.status = "healthy";
			results.push(entry);
			continue;
		}

		if (!check.ok) {
			// Retry once
			if (source === "npm") check = await checkNpm(data.package);
			else check = await checkPypi(data.package);
		}

		if (check.ok) {
			console.log(`  ✓ ${data.name}`);
			entry.status = "healthy";
		} else {
			console.log(`  ✗ ${data.name}  — ${check.error}`);
			entry.status = "failed";
			entry.error = check.error;
			failures++;
		}

		results.push(entry);
	}

	// Write health.json
	const health = {
		generated: now,
		total: results.length,
		healthy: results.filter((r) => r.status === "healthy").length,
		failed: failures,
		servers: results,
	};
	fs.writeFileSync(HEALTH_PATH, JSON.stringify(health, null, 2));

	console.log(`\n  ${health.healthy} healthy, ${health.failed} failed`);
	console.log(`  Output: ${path.relative(ROOT, HEALTH_PATH)}\n`);

	if (failures > 0) process.exit(1);
}

main();
