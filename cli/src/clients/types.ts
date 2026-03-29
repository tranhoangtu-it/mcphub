// Supported AI client identifiers
export type ClientType =
  | "claude-desktop"
  | "cursor"
  | "vscode"
  | "windsurf"
  | "claude-code";

// MCP server entry stored in client config files
export interface ServerEntry {
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  type?: "stdio" | "http" | "sse";
  url?: string;
}

// Registry server definition (from index.json)
export interface RegistryServer {
  name: string;
  package: string;
  source: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  verified: boolean;
  config: ServerEntry;
  links?: {
    repo?: string;
    docs?: string;
  };
}

// Registry bundle definition (from index.json)
export interface RegistryBundle {
  name: string;
  description: string;
  category?: string;
  servers: string[];
}

// Full registry index shape
export interface RegistryIndex {
  version: string;
  generated?: string;
  stats?: {
    servers: number;
    bundles: number;
    categories: string[];
  };
  servers: Record<string, RegistryServer>;
  bundles: Record<string, RegistryBundle>;
}

// Interface each client handler must implement
export interface ClientHandler {
  readonly type: ClientType;
  readonly displayName: string;
  isInstalled(): boolean;
  addServer(name: string, entry: ServerEntry): void;
  removeServer(name: string): void;
  listServers(): Record<string, ServerEntry>;
}
