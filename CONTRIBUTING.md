# Contributing to mcphub

Thank you for helping grow the MCP server ecosystem! This guide explains how to add servers, bundles, and contribute to the project.

## Adding a Server (5 minutes)

### Step 1: Fork & Clone

```bash
git clone https://github.com/<your-username>/mcphub.git
cd mcphub
npm install
```

### Step 2: Create a YAML file

Create `registry/servers/<name>.yaml` where `<name>` matches the `name` field inside:

```yaml
name: my-server
package: "@scope/mcp-server-name"
source: npm                          # npm | pypi | github | docker
description: "What this server does (max 200 chars)"
category: developer-tools            # See categories below
tags: [tag1, tag2, tag3]             # Max 10 tags
author: your-name
verified: false                      # Only maintainers set true
config:
  command: npx                       # npx for npm, uvx for pypi
  args: ["-y", "@scope/mcp-server-name"]
  env: {}                            # See "Environment Variables" below
links:
  repo: "https://github.com/org/repo"
  docs: "https://docs.example.com"   # Optional
  homepage: "https://example.com"    # Optional
```

### Step 3: Validate locally

```bash
npm run validate          # Schema validation
npm run check-packages    # Verify package exists on npm/pypi
```

### Step 4: Submit a PR

```bash
git checkout -b add-my-server
git add registry/servers/my-server.yaml
git commit -m "feat: add my-server"
git push origin add-my-server
```

Open a PR. CI will automatically validate your entry. If CI passes, a maintainer will merge it.

## YAML Schema Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Unique ID, kebab-case (`^[a-z0-9-]+$`). Must match filename. |
| `package` | string | Package identifier (npm: `@scope/name`, pypi: `name`) |
| `description` | string | What the server does. Max 200 characters. |
| `category` | string | One of the categories below. |
| `config` | object | How to run the server. Must have `command` and `args`. |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `source` | string | `npm` (default), `pypi`, `github`, `docker` |
| `tags` | string[] | Search keywords. Max 10. |
| `author` | string | Package author or organization. |
| `verified` | boolean | Set by maintainers only. Don't set to `true`. |
| `config.env` | object | Environment variables. See below. |
| `clients` | object | Per-client config overrides. See below. |
| `links` | object | `repo`, `docs`, `homepage` URLs. |

### Categories

| Category | For |
|----------|-----|
| `developer-tools` | Code editors, linters, formatters, SDKs |
| `database` | SQL, NoSQL, BaaS (Postgres, Supabase, Redis) |
| `web` | HTTP, browsers, search, scraping |
| `ai` | LLM tools, memory, reasoning |
| `cloud` | AWS, Azure, GCP, serverless |
| `productivity` | Project management, CRM, notes |
| `devops` | CI/CD, containers, orchestration |
| `communication` | Chat, email, messaging |
| `design` | UI tools, diagrams, prototyping |
| `analytics` | Monitoring, logging, APM |
| `security` | Auth, encryption, scanning |
| `other` | Anything that doesn't fit above |

### Environment Variables

For servers that need API keys or tokens, set the value to an empty string. mcphub will prompt users to fill them in:

```yaml
config:
  command: npx
  args: ["-y", "@scope/my-server"]
  env:
    API_KEY: ""              # Required — user must set
    OPTIONAL_FLAG: "default" # Optional — has a default value
```

### Per-Client Overrides

If a server needs different config for specific AI clients:

```yaml
config:
  command: npx
  args: ["-y", "@scope/my-server", "."]
clients:
  vscode:
    args: ["-y", "@scope/my-server", "${workspaceFolder}"]
  claude-desktop:
    args: ["-y", "@scope/my-server", "/home/user/projects"]
```

Supported client keys: `claude-desktop`, `cursor`, `vscode`, `windsurf`, `claude-code`

## Adding a Bundle

Bundles are curated collections of servers for a specific use case.

Create `registry/bundles/<name>.yaml`:

```yaml
name: my-bundle
description: "What this bundle is for (max 300 chars)"
category: development
servers:
  - server-name-1      # Must exist in registry/servers/
  - server-name-2
  - server-name-3
```

**Rules:**
- All listed servers must exist in `registry/servers/`
- Min 1 server, recommended 4-10
- Bundle names must be kebab-case

## What CI Checks

When you submit a PR, GitHub Actions automatically runs:

| Check | What it does |
|-------|-------------|
| **Schema validation** | YAML matches JSON Schema (required fields, types, patterns) |
| **Package existence** | npm/pypi package actually exists and is published |
| **Filename match** | `my-server.yaml` must contain `name: my-server` |
| **Bundle cross-ref** | Every server in a bundle must exist in `registry/servers/` |
| **Lint** | Code style (for CLI/script changes only) |

If all checks pass, your PR is ready for merge.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Filename doesn't match `name` field | `my-server.yaml` must have `name: my-server` |
| Package doesn't exist on npm | Double-check package name with `npm view @scope/name` |
| Description too long | Keep under 200 characters |
| `verified: true` | Only maintainers set this. Use `false` or omit it. |
| Missing `command` or `args` in config | Both are required |

## Development Setup

For CLI or script contributions:

```bash
git clone https://github.com/<your-username>/mcphub.git
cd mcphub
npm install

# Validate registry
npm run validate

# Build CLI
npm run build:index && npm run build:cli

# Test CLI
node cli/dist/index.cjs list
node cli/dist/index.cjs search database

# Run auto-discovery
npm run discover

# Run health check
npm run health-check
```

## Questions?

Open an issue on GitHub. We're happy to help!
