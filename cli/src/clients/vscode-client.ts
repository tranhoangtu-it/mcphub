import path from "node:path";
import { BaseClientHandler } from "./base-client-handler.js";
import type { ClientType } from "./types.js";

/**
 * VS Code client handler.
 * Config: ~/.vscode/mcp.json
 * Root key: servers (NOT mcpServers — VS Code uses different key)
 */
export class VSCodeClient extends BaseClientHandler {
  readonly type: ClientType = "vscode";
  readonly displayName = "VS Code";

  protected getConfigPath(): string {
    const home = process.env["HOME"] || process.env["USERPROFILE"] || "~";
    return path.join(home, ".vscode", "mcp.json");
  }

  protected getRootKey(): string {
    // VS Code uses "servers", not "mcpServers"
    return "servers";
  }
}
