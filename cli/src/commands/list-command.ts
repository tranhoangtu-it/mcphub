import { defineCommand } from "citty";
import pc from "picocolors";
import { listAllServers } from "../core/registry-loader.js";
import { logger } from "../utils/logger.js";

export const listCommand = defineCommand({
  meta: {
    name: "list",
    description: "List all available MCP servers in the registry",
  },
  args: {
    category: {
      type: "string",
      description: "Filter by category (e.g. database, web, ai)",
      alias: "c",
    },
  },
  run({ args }) {
    const servers = listAllServers();

    const filtered = args.category
      ? servers.filter((s) => s.category === args.category)
      : servers;

    if (filtered.length === 0) {
      logger.warn(
        args.category
          ? `No servers found in category: ${args.category}`
          : "Registry is empty."
      );
      return;
    }

    // Group by category for display
    const byCategory = new Map<string, typeof filtered>();
    for (const server of filtered) {
      const group = byCategory.get(server.category) ?? [];
      group.push(server);
      byCategory.set(server.category, group);
    }

    logger.bold(`\n${pc.bold("Available MCP Servers")} (${filtered.length} total)\n`);

    for (const [category, list] of [...byCategory.entries()].sort()) {
      console.log(pc.bold(pc.yellow(`  ${category}`)));
      for (const s of list) {
        const verified = s.verified ? pc.green(" ✔") : "";
        const name = pc.cyan(s.name.padEnd(26));
        console.log(`    ${name}${verified}  ${pc.dim(s.description)}`);
      }
      console.log();
    }

    console.log(
      pc.dim(`  ✔ = verified  |  Run ${pc.bold("mcphub info <server>")} for details\n`)
    );
  },
});
