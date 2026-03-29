import fs from "node:fs";
import path from "node:path";
import type { RegistryBundle, RegistryIndex, RegistryServer } from "../clients/types.js";

// CJS __dirname is available natively; for ESM tsup injects a shim.
// We declare it to satisfy TypeScript when moduleResolution is NodeNext.
declare const __dirname: string;

// Bundled registry: tsup copies index.json into dist/registry/ via tsup config
const BUNDLED_INDEX_PATH = path.join(__dirname, "registry", "index.json");

// Dev fallback: running from cli/dist/ the registry is 3 levels up
const DEV_INDEX_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "registry",
  "index.json"
);

let cachedRegistry: RegistryIndex | null = null;

/**
 * Loads the registry index. Tries bundled path first, then dev source path.
 * Result is cached in memory for the process lifetime.
 */
export function loadRegistry(): RegistryIndex {
  if (cachedRegistry) return cachedRegistry;

  const candidates = [BUNDLED_INDEX_PATH, DEV_INDEX_PATH];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, "utf-8");
        cachedRegistry = JSON.parse(raw) as RegistryIndex;
        return cachedRegistry;
      } catch (err) {
        throw new Error(`Failed to parse registry at ${candidate}: ${err}`);
      }
    }
  }

  throw new Error(
    "Registry index.json not found. Tried:\n" + candidates.join("\n")
  );
}

/**
 * Look up a single server by name. Returns undefined if not found.
 */
export function findServer(name: string): RegistryServer | undefined {
  const registry = loadRegistry();
  return registry.servers[name];
}

/**
 * Return all servers as an array.
 */
export function listAllServers(): RegistryServer[] {
  const registry = loadRegistry();
  return Object.values(registry.servers);
}

/**
 * Search servers by query string against name, description, tags, category.
 * Case-insensitive substring match.
 */
export function searchServers(query: string): RegistryServer[] {
  const q = query.toLowerCase();
  return listAllServers().filter((s) => {
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.tags.some((t) => t.toLowerCase().includes(q))
    );
  });
}

/** Return all bundles as an array. */
export function listAllBundles(): RegistryBundle[] {
  const registry = loadRegistry();
  return Object.values(registry.bundles);
}

/** Look up a bundle by name. */
export function findBundle(name: string): RegistryBundle | undefined {
  const registry = loadRegistry();
  return registry.bundles[name];
}

/** Resolve a bundle to its list of server entries. */
export function resolveBundleServers(bundle: RegistryBundle): RegistryServer[] {
  const registry = loadRegistry();
  return bundle.servers
    .map((name) => registry.servers[name])
    .filter(Boolean);
}
