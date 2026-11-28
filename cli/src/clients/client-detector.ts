import { ClaudeDesktopClient } from "./claude-desktop-client.js";
import { CursorClient } from "./cursor-client.js";
import { VSCodeClient } from "./vscode-client.js";
import { WindsurfClient } from "./windsurf-client.js";
import { ClaudeCodeClient } from "./claude-code-client.js";
import { ZedClient } from "./zed-client.js";
import { GeminiCliClient } from "./gemini-cli-client.js";
import type { ClientHandler, ClientType } from "./types.js";

// All supported client handlers in detection order
const ALL_CLIENTS: ClientHandler[] = [
  new ClaudeDesktopClient(),
  new CursorClient(),
  new VSCodeClient(),
  new WindsurfClient(),
  new ClaudeCodeClient(),
  new ZedClient(),
  new GeminiCliClient(),
];

/**
 * Returns all supported client type identifiers.
 */
export function getValidClientTypes(): ClientType[] {
  return ALL_CLIENTS.map((c) => c.type);
}

/**
 * Returns all client handlers that have a detectable config file on disk.
 */
export function detectInstalledClients(): ClientHandler[] {
  return ALL_CLIENTS.filter((c) => c.isInstalled());
}

/**
 * Returns a specific client handler by its ClientType string.
 * Throws if the type is not recognized.
 */
export function getClientByType(type: ClientType): ClientHandler {
  const handler = ALL_CLIENTS.find((c) => c.type === type);
  if (!handler) {
    throw new Error(`Unknown client type: ${type}`);
  }
  return handler;
}

/**
 * Returns all client handlers regardless of installation status.
 */
export function getAllClients(): ClientHandler[] {
  return ALL_CLIENTS;
}
