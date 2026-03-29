import {
  detectInstalledClients,
  getClientByType,
} from "../clients/client-detector.js";
import type { ClientHandler, ClientType, ServerEntry } from "../clients/types.js";
import { logger } from "../utils/logger.js";

export interface InstallResult {
  client: ClientHandler;
  success: boolean;
  error?: string;
}

/**
 * Installs a server entry directly into one or more AI client config files.
 *
 * @param serverName  Key to use in the client's mcpServers map
 * @param entry       The ServerEntry config to write
 * @param targetClient  Optional: install only to this client type
 * @returns Array of per-client install results
 */
export function installDirect(
  serverName: string,
  entry: ServerEntry,
  targetClient?: ClientType
): InstallResult[] {
  let clients: ClientHandler[];

  if (targetClient) {
    // Install to a specific client (whether detected or not)
    try {
      clients = [getClientByType(targetClient)];
    } catch (err) {
      return [
        {
          client: { type: targetClient, displayName: targetClient } as ClientHandler,
          success: false,
          error: String(err),
        },
      ];
    }
  } else {
    // Auto-detect installed clients
    clients = detectInstalledClients();
    if (clients.length === 0) {
      logger.warn("No AI clients detected on this machine.");
      return [];
    }
  }

  const results: InstallResult[] = [];

  for (const client of clients) {
    try {
      client.addServer(serverName, entry);
      results.push({ client, success: true });
    } catch (err) {
      results.push({ client, success: false, error: String(err) });
    }
  }

  return results;
}
