import path from "node:path";
import { BaseClientHandler } from "./base-client-handler.js";
import type { ClientType } from "./types.js";

/**
 * Claude Code client handler.
 * Config: ~/.claude/settings.json
 * Root key: mcpServers
 */
export class ClaudeCodeClient extends BaseClientHandler {
  readonly type: ClientType = "claude-code";
  readonly displayName = "Claude Code";

  protected getConfigPath(): string {
    const home = process.env["HOME"] || process.env["USERPROFILE"] || "~";
    return path.join(home, ".claude", "settings.json");
  }

  protected getRootKey(): string {
    return "mcpServers";
  }
}
