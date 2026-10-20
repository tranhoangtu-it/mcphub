# mcphub

![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg) [![GitHub stars](https://img.shields.io/github/stars/tranhoangtu-it/mcphub)](https://github.com/tranhoangtu-it/mcphub)

One CLI to browse, search, and install curated MCP (Model Context Protocol) servers into every AI client you use.

## Why mcphub?

Setting up MCP servers means finding the right packages, figuring out config formats for each AI client, and managing environment variables. mcphub keeps a curated registry of verified configs and writes them to the right place for each client, so a server goes from discovery to working in one command.

- **40 curated servers** — Verified configs ready to install in one command
- **5 bundles** — Pre-built collections by use case (web-dev, data-science, devops, full-stack, productivity)
- **5 AI clients** — Claude Desktop, VS Code, Cursor, Windsurf, Claude Code
- **Auto-discovery** — Plus servers auto-discovered weekly by the `discover.yml` workflow
- **Zero config** — Works instantly with `npx`, no global install needed

## Quick Start

```bash
# Install a single server
npx mcphub install filesystem

# Install a bundle (multiple servers at once)
npx mcphub bundle install web-developer

# Search servers
npx mcphub search database

# List all available servers
npx mcphub list

# Show server details
npx mcphub info postgres

# Show bundle contents before installing
npx mcphub bundle show devops
```

## Available Bundles

| Bundle | Servers | Use Case |
|--------|---------|----------|
| **web-developer** | filesystem, git, github, fetch, puppeteer, postgres, sequential-thinking | Frontend & backend web dev |
| **data-science** | filesystem, postgres, sqlite, fetch, memory, sequential-thinking | Data analysis & AI workflows |
| **devops** | docker, kubectl, aws, github, git, sentry | Infrastructure & deployment |
| **full-stack** | filesystem, git, github, fetch, puppeteer, postgres, docker, sequential-thinking, memory | Complete dev setup |
| **productivity** | slack, notion, linear, jira, github | Communication & project management |

## How It Works

> [View interactive architecture diagram on Excalidraw](https://excalidraw.com/#json=yPIOD2dxsstmfz2cvqpXk,zP-lcGRPTD5Hba3CtK1Jkw)

Server and bundle definitions live as YAML files in the registry. `build-index.ts` compiles them into a single `registry/index.json`, which the CLI loads to resolve servers and bundles and install them into client configs:

```mermaid
flowchart TD
    Y["registry/servers/*.yaml\nregistry/bundles/*.yaml"] --> BI["build-index.ts"]
    BI --> IDX["registry/index.json"]
    IDX --> CLI["npx mcphub install &lt;server&gt;\nor bundle install &lt;bundle&gt;"]
    CLI --> R["Resolve server config\n(bundle expands to its servers)"]
    R --> D{"mcpman installed\nand no --client flag?"}
    D -->|YES| E["Delegate to mcpman\n(lockfile, rollback)"]
    E -->|fails| F
    D -->|NO| F["Detect AI clients"]
    F --> G["Write config to each\nclient's JSON file"]
    E --> H["Done! Restart AI client"]
    G --> H
```

The index is built locally with `build-index.ts` (`npm run build:index`). mcphub writes the resolved config to the correct file for each detected AI client:

| Client | Config Path | Root Key |
|--------|------------|----------|
| Claude Desktop | `%APPDATA%/Claude/claude_desktop_config.json` (macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`) | `mcpServers` |
| Cursor | `%APPDATA%/Cursor/User/globalStorage/cursor.mcp/mcp.json` (otherwise `~/.config/Cursor/User/globalStorage/cursor.mcp/mcp.json`) | `mcpServers` |
| VS Code | `~/.vscode/mcp.json` | `servers` |
| Windsurf | `~/.windsurf/mcp.json` | `mcpServers` |
| Claude Code | `~/.claude/settings.json` | `mcpServers` |

## With mcpman

[mcpman](https://github.com/tranhoangtu-it/mcpman) is a full-featured MCP package manager. mcphub integrates with it seamlessly:

```mermaid
flowchart LR
    subgraph mcphub["mcphub (WHAT)"]
        R[Curated Registry]
        B[Bundles]
        D[Auto-Discovery]
        S[Quality Scoring]
    end
    subgraph mcpman["mcpman (HOW)"]
        I[Smart Installer]
        L[Lockfile]
        RB[Rollback]
        V[Vault]
    end
    DEV["Developer"] --> mcphub
    DEV --> mcpman
    mcphub -->|delegates| mcpman
    mcpman -->|resolves from| mcphub
    mcpman --> AI["AI Clients"]
    mcphub -->|fallback| AI
```

**mcphub = what to install** (curated catalog, bundles, scoring)
**mcpman = how to install** (lockfile, rollback, version management, 10+ clients)

### Option 1: Automatic (Recommended)

If mcpman is installed globally, mcphub automatically delegates to it:

```bash
npm install -g mcpman
npx mcphub install filesystem    # → automatically uses mcpman under the hood
```

### Option 2: mcpman Plugin

For richer integration (search, bundles via mcpman):

```bash
# Copy plugin to ~/.mcpman/plugins/mcphub/
mcpman install mcphub:filesystem    # Resolves from mcphub registry
```

### Standalone (No mcpman)

mcphub works perfectly without mcpman. It writes configs directly to your AI client files. mcpman just adds lifecycle features (lockfile, rollback, updates).

## Server Categories

| Category | Examples |
|----------|---------|
| **developer-tools** | filesystem, git, github, gitlab, eslint, storybook, context7, openapi |
| **database** | postgres, sqlite, supabase |
| **web** | fetch, brave-search, puppeteer, chrome-devtools, tavily, apify |
| **ai** | memory, sequential-thinking |
| **cloud** | aws, azure |
| **devops** | docker, kubectl, circleci |
| **productivity** | notion, linear, jira, clickup, salesforce, hubspot, google-calendar |
| **analytics** | sentry, datadog, dynatrace |
| **design** | figma, drawio |
| **communication** | slack |

## Contributing

Want to add an MCP server? See [CONTRIBUTING.md](./CONTRIBUTING.md).

**TL;DR:** Create a YAML file, submit a PR, CI validates automatically.

## Project Structure

```
mcphub/
├── registry/
│   ├── servers/        # 40 curated server YAML configs
│   ├── bundles/        # 5 curated bundles
│   └── discovered/     # auto-discovered servers (generated weekly)
├── cli/                # Standalone CLI (npx mcphub)
├── website/            # GitHub Pages static site
├── schema/             # JSON Schema for validation
├── scripts/            # Validate, build, discover, health-check
└── .github/workflows/  # CI: validate PRs, build, release, discover, health
```

## License

[MIT](./LICENSE)
