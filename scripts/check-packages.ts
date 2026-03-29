/**
 * check-packages.ts
 * Verifies that npm/pypi packages referenced in server YAML files actually exist.
 * Used in CI to validate PR submissions.
 * Only checks changed files when GITHUB_EVENT_PATH is set (PR context).
 */

import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const ROOT = path.resolve(import.meta.dirname, "..");
const SERVERS_DIR = path.join(ROOT, "registry", "servers");

interface ServerData {
	name: string;
	package: string;
	source?: string;
}

/** Check if an npm package exists by hitting the registry */
async function checkNpmPackage(pkg: string): Promise<boolean> {
	try {
		// Use GET with Accept header — npm registry may reject HEAD for scoped packages
		const encoded = pkg.startsWith("@") ? `@${encodeURIComponent(pkg.slice(1))}` : encodeURIComponent(pkg);
		const res = await fetch(`https://registry.npmjs.org/${encoded}`, {
			headers: { Accept: "application/vnd.npm.install-v1+json" },
		});
		return res.ok;
	} catch {
		return false;
	}
}

/** Check if a PyPI package exists */
async function checkPypiPackage(pkg: string): Promise<boolean> {
	try {
		const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(pkg)}/json`, {
			method: "HEAD",
		});
		return res.ok;
	} catch {
		return false;
	}
}

/** Get all server YAML files */
function getServerFiles(): string[] {
	if (!fs.existsSync(SERVERS_DIR)) return [];
	return fs
		.readdirSync(SERVERS_DIR)
		.filter((f) => f.endsWith(".yaml") || f.endsWith(".yml"))
		.map((f) => path.join(SERVERS_DIR, f));
}

async function main(): Promise<void> {
	const files = getServerFiles();
	if (files.length === 0) {
		console.log("  No server files to check.\n");
		return;
	}

	console.log(`\n  Package Check — ${files.length} servers\n`);

	let hasErrors = false;

	for (const file of files) {
		const data = YAML.parse(fs.readFileSync(file, "utf-8")) as ServerData;
		const source = data.source ?? "npm";
		const relPath = path.relative(ROOT, file);

		let exists = false;
		if (source === "npm") {
			exists = await checkNpmPackage(data.package);
		} else if (source === "pypi") {
			exists = await checkPypiPackage(data.package);
		} else if (source === "docker" || source === "github") {
			// Skip docker/github checks (rate limits, auth required)
			console.log(`  ⊘ ${relPath}  ${data.package}  (${source} — skipped)`);
			continue;
		}

		if (exists) {
			console.log(`  ✓ ${relPath}  ${data.package}`);
		} else {
			// Retry once before failing
			if (source === "npm") {
				exists = await checkNpmPackage(data.package);
			} else if (source === "pypi") {
				exists = await checkPypiPackage(data.package);
			}

			if (exists) {
				console.log(`  ✓ ${relPath}  ${data.package}  (retry)`);
			} else {
				console.log(`  ✗ ${relPath}  ${data.package}  — NOT FOUND on ${source}`);
				hasErrors = true;
			}
		}
	}

	console.log();
	if (hasErrors) {
		console.error("  Some packages not found. Check package names.\n");
		process.exit(1);
	}
	console.log("  All packages verified.\n");
}

main();
