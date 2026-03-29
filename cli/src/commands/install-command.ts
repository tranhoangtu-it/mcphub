import { defineCommand } from "citty";
import pc from "picocolors";
import { findServer } from "../core/registry-loader.js";
import { isMcpmanInstalled, delegateToMcpman } from "../core/mcpman-bridge.js";
import { installDirect } from "../core/direct-installer.js";
import { logger } from "../utils/logger.js";
import type { ClientType } from "../clients/types.js";

const VALID_CLIENTS: ClientType[] = [
  "claude-desktop",
  "cursor",
  "vscode",
  "windsurf",
  "claude-code",
];

export const installCommand = defineCommand({
  meta: {
    name: "install",
    description: "Install an MCP server to detected AI clients",
  },
  args: {
    server: {
      type: "positional",
      description: "Server name from registry",
      required: true,
    },
    client: {
      type: "string",
      description: `Target a specific client (${VALID_CLIENTS.join(", ")})`,
      alias: "c",
    },
  },
  run({ args }) {
    const serverName = args.server as string;
    const targetClient = args.client as ClientType | undefined;

    // Validate --client flag if provided
    if (targetClient && !VALID_CLIENTS.includes(targetClient)) {
      logger.error(
        `Unknown client: ${pc.bold(targetClient)}. Valid options: ${VALID_CLIENTS.join(", ")}`
      );
      process.exit(1);
    }

    // Look up server in registry
    const server = findServer(serverName);
    if (!server) {
      logger.error(`Server not found: ${pc.bold(serverName)}`);
      logger.dim(`Run ${pc.bold("mcphub search <query>")} to find servers.`);
      process.exit(1);
      return; // unreachable — narrows server to RegistryServer for TS
    }

    logger.info(`Installing ${pc.bold(server.name)} (${server.package})…`);

    // Delegate to mcpman if available and no specific client is targeted
    if (!targetClient && isMcpmanInstalled()) {
      logger.dim("  mcpman detected — delegating install…");
      const ok = delegateToMcpman(server.package);
      if (ok) {
        logger.success(`Installed via mcpman: ${pc.bold(server.name)}`);
      } else {
        logger.error("mcpman install failed. Falling back to direct install…");
        runDirectInstall(serverName, server, targetClient);
      }
      return;
    }

    runDirectInstall(serverName, server, targetClient);
  },
});

function runDirectInstall(
  serverName: string,
  server: { config: import("../clients/types.js").ServerEntry },
  targetClient?: ClientType
): void {
  const results = installDirect(serverName, server.config, targetClient);

  if (results.length === 0) {
    logger.warn("No AI clients found. Install Claude Desktop, Cursor, VS Code, or Windsurf first.");
    return;
  }

  let anySuccess = false;
  for (const r of results) {
    if (r.success) {
      logger.success(`  ${r.client.displayName}`);
      anySuccess = true;
    } else {
      logger.error(`  ${r.client.displayName}: ${r.error}`);
    }
  }

  if (anySuccess) {
    logger.dim("\n  Restart your AI client to load the new MCP server.");
  }
}
