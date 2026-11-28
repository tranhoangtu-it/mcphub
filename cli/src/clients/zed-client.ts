import path from "node:path";
import { BaseClientHandler } from "./base-client-handler.js";
import type { ClientType } from "./types.js";

/**
 * Zed editor client handler.
 * Config: ~/.config/zed/settings.json
 * Root key: context_servers
 */
export class ZedClient extends BaseClientHandler {
  readonly type: ClientType = "zed";
  readonly displayName = "Zed";

  protected getConfigPath(): string {
    const home = process.env["HOME"] || process.env["USERPROFILE"] || "~";
    const xdg = process.env["XDG_CONFIG_HOME"] || path.join(home, ".config");
    return path.join(xdg, "zed", "settings.json");
  }

  protected getRootKey(): string {
    return "context_servers";
  }
}
