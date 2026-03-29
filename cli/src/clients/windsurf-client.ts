import path from "node:path";
import { BaseClientHandler } from "./base-client-handler.js";
import type { ClientType } from "./types.js";

/**
 * Windsurf client handler.
 * Config: ~/.windsurf/mcp.json
 * Root key: mcpServers
 */
export class WindsurfClient extends BaseClientHandler {
  readonly type: ClientType = "windsurf";
  readonly displayName = "Windsurf";

  protected getConfigPath(): string {
    const home = process.env["HOME"] || process.env["USERPROFILE"] || "~";
    return path.join(home, ".windsurf", "mcp.json");
  }

  protected getRootKey(): string {
    return "mcpServers";
  }
}
