import path from "node:path";
import { BaseClientHandler } from "./base-client-handler.js";
import type { ClientType } from "./types.js";

/**
 * Gemini CLI client handler.
 * Config: ~/.gemini/settings.json
 * Root key: mcpServers
 */
export class GeminiCliClient extends BaseClientHandler {
  readonly type: ClientType = "gemini-cli";
  readonly displayName = "Gemini CLI";

  protected getConfigPath(): string {
    const home = process.env["HOME"] || process.env["USERPROFILE"] || "~";
    return path.join(home, ".gemini", "settings.json");
  }

  protected getRootKey(): string {
    return "mcpServers";
  }
}
