import path from "node:path";
import { BaseClientHandler } from "./base-client-handler.js";
import type { ClientType } from "./types.js";

/**
 * Cursor client handler.
 * Config: %APPDATA%/Cursor/User/globalStorage/cursor.mcp/mcp.json
 * Root key: mcpServers
 */
export class CursorClient extends BaseClientHandler {
  readonly type: ClientType = "cursor";
  readonly displayName = "Cursor";

  protected getConfigPath(): string {
    const appData =
      process.env["APPDATA"] ||
      path.join(process.env["HOME"] ?? "~", ".config");
    return path.join(
      appData,
      "Cursor",
      "User",
      "globalStorage",
      "cursor.mcp",
      "mcp.json"
    );
  }

  protected getRootKey(): string {
    return "mcpServers";
  }
}
