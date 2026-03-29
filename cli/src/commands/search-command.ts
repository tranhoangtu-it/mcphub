import { defineCommand } from "citty";
import pc from "picocolors";
import { searchServers } from "../core/registry-loader.js";
import { logger } from "../utils/logger.js";

export const searchCommand = defineCommand({
  meta: {
    name: "search",
    description: "Search MCP servers by name, tag, or category",
  },
  args: {
    query: {
      type: "positional",
      description: "Search query",
      required: true,
    },
  },
  run({ args }) {
    const query = args.query as string;
    const results = searchServers(query);

    if (results.length === 0) {
      logger.warn(`No servers matched: ${pc.bold(query)}`);
      logger.dim(`Try: mcphub list`);
      return;
    }

    logger.bold(
      `\n${pc.bold("Search results")} for "${pc.cyan(query)}" — ${results.length} found\n`
    );

    for (const s of results) {
      const verified = s.verified ? pc.green(" ✔ verified") : "";
      console.log(
        `  ${pc.bold(pc.cyan(s.name))}${verified}  ${pc.dim("[" + s.category + "]")}`
      );
      console.log(`    ${s.description}`);
      if (s.tags.length > 0) {
        console.log(`    ${pc.dim("tags: " + s.tags.join(", "))}`);
      }
      console.log();
    }

    console.log(
      pc.dim(`  Run ${pc.bold("mcphub info <server>")} for details or ${pc.bold("mcphub install <server>")} to install\n`)
    );
  },
});
