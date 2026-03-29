import { defineCommand } from "citty";
import pc from "picocolors";
import { findServer } from "../core/registry-loader.js";
import { logger } from "../utils/logger.js";

export const infoCommand = defineCommand({
  meta: {
    name: "info",
    description: "Show details for a specific MCP server",
  },
  args: {
    server: {
      type: "positional",
      description: "Server name",
      required: true,
    },
  },
  run({ args }) {
    const name = args.server as string;
    const server = findServer(name);

    if (!server) {
      logger.error(`Server not found: ${pc.bold(name)}`);
      logger.dim(`Run ${pc.bold("mcphub search <query>")} to find servers.`);
      process.exit(1);
      return; // unreachable — narrows server to RegistryServer for TS
    }

    const verified = server.verified
      ? pc.green("✔ verified")
      : pc.dim("community");

    console.log();
    console.log(`  ${pc.bold(pc.cyan(server.name))}  ${verified}`);
    console.log(`  ${server.description}`);
    console.log();
    console.log(`  ${pc.bold("Package:")}   ${server.package}`);
    console.log(`  ${pc.bold("Category:")}  ${server.category}`);
    console.log(`  ${pc.bold("Author:")}    ${server.author}`);

    if (server.tags.length > 0) {
      console.log(`  ${pc.bold("Tags:")}      ${server.tags.join(", ")}`);
    }

    if (server.links?.repo) {
      console.log(`  ${pc.bold("Repo:")}      ${pc.dim(server.links.repo)}`);
    }

    // Config preview
    console.log();
    console.log(`  ${pc.bold("Config:")}`);
    if (server.config.command) {
      const cmdLine = [server.config.command, ...(server.config.args ?? [])].join(" ");
      console.log(`    ${pc.dim("command:")} ${cmdLine}`);
    }
    if (server.config.url) {
      console.log(`    ${pc.dim("url:")} ${server.config.url}`);
    }

    const envKeys = Object.keys(server.config.env ?? {});
    if (envKeys.length > 0) {
      console.log(`    ${pc.dim("env:")} ${envKeys.join(", ")}`);
    }

    console.log();
    console.log(
      pc.dim(
        `  Run ${pc.bold("mcphub install " + server.name)} to add this server to your AI clients.\n`
      )
    );
  },
});
