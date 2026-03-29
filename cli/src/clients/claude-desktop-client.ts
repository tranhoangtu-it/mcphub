import path from "node:path";
import { BaseClientHandler } from "./base-client-handler.js";
import type { ClientType } from "./types.js";

/**
 * Claude Desktop client handler.
 * Config: %APPDATA%/Claude/claude_desktop_config.json
 * Root key: mcpServers
 */
export class ClaudeDesktopClient extends BaseClientHandler {
  readonly type: ClientType = "claude-desktop";
  readonly displayName = "Claude Desktop";

  protected getConfigPath(): string {
    const appData =
      process.env["APPDATA"] ||
      path.join(process.env["HOME"] ?? "~", "Library", "Application Support");
    return path.join(appData, "Claude", "claude_desktop_config.json");
  }

  protected getRootKey(): string {
    return "mcpServers";
  }
}
