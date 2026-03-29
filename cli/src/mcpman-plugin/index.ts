/**
 * mcpman-plugin/index.ts
 * mcpman plugin that enables "mcphub:" prefix for installing servers.
 *
 * Usage:
 *   1. Copy this built file to ~/.mcpman/plugins/mcphub/index.js
 *   2. Then: mcpman install mcphub:filesystem
 *
 * The plugin fetches mcphub's registry index.json from GitHub
 * and resolves server configs for mcpman to install.
 */

const REGISTRY_URL =
	"https://raw.githubusercontent.com/user/mcphub/main/registry/index.json";

interface ServerMetadata {
	name: string;
	command: string;
	args: string[];
	env?: Record<string, string>;
	package?: string;
	version?: string;
}

interface RegistryIndex {
	servers: Record<
		string,
		{
			name: string;
			package: string;
			config: { command: string; args: string[]; env?: Record<string, string> };
		}
	>;
}

let cachedIndex: RegistryIndex | null = null;

/** Fetch and cache registry index */
async function getIndex(): Promise<RegistryIndex> {
	if (cachedIndex) return cachedIndex;
	const res = await fetch(REGISTRY_URL);
	if (!res.ok) throw new Error(`Failed to fetch mcphub registry: ${res.status}`);
	cachedIndex = (await res.json()) as RegistryIndex;
	return cachedIndex;
}

export default {
	name: "mcphub",
	prefix: "mcphub:",

	/** Resolve a server name to metadata mcpman can install */
	async resolve(input: string): Promise<ServerMetadata> {
		const index = await getIndex();
		const server = index.servers[input];
		if (!server) {
			throw new Error(
				`Server "${input}" not found in mcphub registry. Run "npx mcphub list" to see available servers.`,
			);
		}
		return {
			name: server.name,
			command: server.config.command,
			args: server.config.args,
			env: server.config.env,
			package: server.package,
		};
	},

	/** Search mcphub registry */
	async search(query: string): Promise<Array<{ name: string; description: string }>> {
		const index = await getIndex();
		const q = query.toLowerCase();
		return Object.values(index.servers)
			.filter(
				(s) =>
					s.name.toLowerCase().includes(q) ||
					(s as unknown as { description: string }).description?.toLowerCase().includes(q),
			)
			.map((s) => ({
				name: s.name,
				description: (s as unknown as { description: string }).description ?? "",
			}));
	},
};
