import fs from "node:fs";
import path from "node:path";
import type { ClientHandler, ClientType, ServerEntry } from "./types.js";

/**
 * Abstract base for all AI client config handlers.
 * Provides atomic JSON read/write (write-to-tmp then rename).
 * Subclasses provide: configPath, rootKey, type, displayName.
 */
export abstract class BaseClientHandler implements ClientHandler {
  abstract readonly type: ClientType;
  abstract readonly displayName: string;

  /** Absolute path to the client's config JSON file */
  protected abstract getConfigPath(): string;

  /** Top-level key under which MCP servers are stored */
  protected abstract getRootKey(): string;

  isInstalled(): boolean {
    return fs.existsSync(this.getConfigPath());
  }

  protected readConfig(): Record<string, unknown> {
    const configPath = this.getConfigPath();
    if (!fs.existsSync(configPath)) {
      return {};
    }
    try {
      const raw = fs.readFileSync(configPath, "utf-8");
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      // Return empty object if file is corrupt — caller will overwrite
      return {};
    }
  }

  protected writeConfig(config: Record<string, unknown>): void {
    const configPath = this.getConfigPath();
    const dir = path.dirname(configPath);

    // Ensure parent directory exists
    fs.mkdirSync(dir, { recursive: true });

    const tmpPath = configPath + ".tmp";
    const json = JSON.stringify(config, null, 2);

    // Atomic write: write to .tmp then rename
    // On Windows, rename fails if target exists — remove first
    fs.writeFileSync(tmpPath, json, "utf-8");
    try {
      fs.renameSync(tmpPath, configPath);
    } catch {
      // Fallback for Windows EPERM: copy + unlink
      fs.copyFileSync(tmpPath, configPath);
      fs.unlinkSync(tmpPath);
    }
  }

  addServer(name: string, entry: ServerEntry): void {
    // Prevent prototype pollution via __proto__, constructor, etc.
    if (name === "__proto__" || name === "constructor" || name === "prototype") {
      throw new Error(`Invalid server name: "${name}"`);
    }
    const config = this.readConfig();
    const rootKey = this.getRootKey();

    if (typeof config[rootKey] !== "object" || config[rootKey] === null) {
      config[rootKey] = {};
    }

    const servers = config[rootKey] as Record<string, ServerEntry>;
    servers[name] = entry;
    config[rootKey] = servers;

    this.writeConfig(config);
  }

  removeServer(name: string): void {
    const config = this.readConfig();
    const rootKey = this.getRootKey();

    if (typeof config[rootKey] === "object" && config[rootKey] !== null) {
      const servers = config[rootKey] as Record<string, ServerEntry>;
      delete servers[name];
      config[rootKey] = servers;
      this.writeConfig(config);
    }
  }

  listServers(): Record<string, ServerEntry> {
    const config = this.readConfig();
    const rootKey = this.getRootKey();
    const val = config[rootKey];
    if (typeof val === "object" && val !== null) {
      return val as Record<string, ServerEntry>;
    }
    return {};
  }
}
