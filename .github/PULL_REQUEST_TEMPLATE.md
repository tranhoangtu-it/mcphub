## What

<!-- Brief description of what you're adding/changing -->

## Type

- [ ] New server entry (`registry/servers/`)
- [ ] New bundle (`registry/bundles/`)
- [ ] CLI feature/fix (`cli/`)
- [ ] Script improvement (`scripts/`)
- [ ] Documentation
- [ ] Other

## For Server/Bundle PRs

- [ ] YAML validates: `npm run validate`
- [ ] Package exists: `npm run check-packages`
- [ ] Filename matches `name` field
- [ ] `verified` is `false` (only maintainers set `true`)
- [ ] Description under 200 characters

## For Code PRs

- [ ] TypeScript compiles: `cd cli && npx tsc --noEmit`
- [ ] CLI builds: `npm run build:cli`
- [ ] Lint passes: `npm run lint`
