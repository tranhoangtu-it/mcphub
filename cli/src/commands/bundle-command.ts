/**
 * bundle-command.ts
 * CLI subcommand: mcphub bundle <list|show|install>
 * Manages curated server bundles — grouped collections by use case.
 */

import { defineCommand } from "citty";
import pc from "picocolors";
import {
	findBundle,
	findServer,
	listAllBundles,
	resolveBundleServers,
} from "../core/registry-loader.js";
import { installDirect } from "../core/direct-installer.js";
import { delegateToMcpman, isMcpmanInstalled } from "../core/mcpman-bridge.js";
import type { ClientType } from "../clients/types.js";

const listCmd = defineCommand({
	meta: { name: "list", description: "List all available bundles" },
	async run() {
		const bundles = listAllBundles();
		if (bundles.length === 0) {
			console.log(pc.dim("  No bundles available."));
			return;
		}

		console.log(`\n${pc.bold("Available Bundles")} (${bundles.length})\n`);
		for (const b of bundles) {
			console.log(
				`  ${pc.bold(pc.cyan(b.name))}  ${pc.dim(`(${b.servers.length} servers)`)}`,
			);
			console.log(`    ${b.description}`);
		}
		console.log();
	},
});

const showCmd = defineCommand({
	meta: { name: "show", description: "Show bundle contents" },
	args: {
		name: {
			type: "positional",
			description: "Bundle name",
			required: true,
		},
	},
	async run({ args }) {
		const bundle = findBundle(args.name);
		if (!bundle) {
			console.error(`${pc.red("✗")} Bundle "${args.name}" not found.`);
			console.log(pc.dim("  Run 'mcphub bundle list' to see available bundles."));
			process.exit(1);
		}

		const servers = resolveBundleServers(bundle);
		console.log(`\n${pc.bold(pc.cyan(bundle.name))} — ${bundle.description}\n`);
		console.log(`  ${pc.bold("Servers")} (${servers.length}):\n`);

		for (const s of servers) {
			const verified = s.verified ? pc.green(" ✔") : "";
			console.log(`    ${pc.cyan(s.name)}${verified}  ${pc.dim(s.description)}`);
		}

		// Show required env vars
		const envVars = new Map<string, string[]>();
		for (const s of servers) {
			const env = s.config.env ?? {};
			for (const key of Object.keys(env)) {
				if (!envVars.has(key)) envVars.set(key, []);
				envVars.get(key)!.push(s.name);
			}
		}
		if (envVars.size > 0) {
			console.log(`\n  ${pc.bold("Required Environment Variables")}:\n`);
			for (const [key, usedBy] of envVars) {
				console.log(`    ${pc.yellow(key)}  ${pc.dim(`(${usedBy.join(", ")})`)}`);
			}
		}

		console.log(`\n  ${pc.dim("Run:")} mcphub bundle install ${bundle.name}\n`);
	},
});

const installCmd = defineCommand({
	meta: { name: "install", description: "Install all servers in a bundle" },
	args: {
		name: {
			type: "positional",
			description: "Bundle name",
			required: true,
		},
		client: {
			type: "string",
			description: "Target client (claude-desktop, cursor, vscode, windsurf, claude-code)",
		},
		exclude: {
			type: "string",
			description: "Comma-separated server names to skip",
		},
	},
	async run({ args }) {
		const bundle = findBundle(args.name);
		if (!bundle) {
			console.error(`${pc.red("✗")} Bundle "${args.name}" not found.`);
			process.exit(1);
		}

		const excludeSet = new Set(
			args.exclude ? (args.exclude as string).split(",").map((s) => s.trim()) : [],
		);

		const serverNames = bundle.servers.filter((s) => !excludeSet.has(s));
		console.log(
			`\n${pc.bold("Installing bundle:")} ${pc.cyan(bundle.name)} (${serverNames.length} servers)\n`,
		);

		const results: { name: string; ok: boolean; error?: string }[] = [];

		for (const name of serverNames) {
			const server = findServer(name);
			if (!server) {
				results.push({ name, ok: false, error: "Not found in registry" });
				continue;
			}

			process.stdout.write(`  Installing ${pc.cyan(name)}... `);
			try {
				// Try mcpman first, fallback to direct install
				const useMcpman = isMcpmanInstalled();
				let ok = false;
				if (useMcpman) {
					ok = delegateToMcpman(server.package);
				}
				if (!useMcpman || !ok) {
					const installResults = installDirect(name, server.config, args.client as ClientType | undefined);
					ok = installResults.length > 0 && installResults.some((r) => r.success);
				}
				if (ok) {
					console.log(pc.green("✓"));
					results.push({ name, ok: true });
				} else {
					console.log(pc.red("✗"));
					results.push({ name, ok: false, error: "No clients installed or install failed" });
				}
			} catch (err) {
				console.log(pc.red("✗"));
				results.push({ name, ok: false, error: String(err) });
			}
		}

		// Summary
		const passed = results.filter((r) => r.ok).length;
		const failed = results.filter((r) => !r.ok).length;
		console.log();
		console.log(
			`  ${pc.green(`${passed} installed`)}${failed > 0 ? `, ${pc.red(`${failed} failed`)}` : ""}`,
		);
		if (failed > 0) {
			for (const r of results.filter((r) => !r.ok)) {
				console.log(`    ${pc.red("✗")} ${r.name}: ${pc.dim(r.error ?? "unknown")}`);
			}
		}
		console.log();
	},
});

export const bundleCommand = defineCommand({
	meta: {
		name: "bundle",
		description: "Manage curated server bundles",
	},
	subCommands: {
		list: listCmd,
		show: showCmd,
		install: installCmd,
	},
});
