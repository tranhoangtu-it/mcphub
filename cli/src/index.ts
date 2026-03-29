#!/usr/bin/env node
import { defineCommand, runMain } from "citty";
import { APP_NAME, APP_VERSION } from "./utils/constants.js";
import { listCommand } from "./commands/list-command.js";
import { searchCommand } from "./commands/search-command.js";
import { infoCommand } from "./commands/info-command.js";
import { installCommand } from "./commands/install-command.js";
import { bundleCommand } from "./commands/bundle-command.js";

const main = defineCommand({
  meta: {
    name: APP_NAME,
    version: APP_VERSION,
    description: "Curated MCP server registry — install servers to any AI client",
  },
  subCommands: {
    list: listCommand,
    search: searchCommand,
    info: infoCommand,
    install: installCommand,
    bundle: bundleCommand,
  },
});

runMain(main);
