import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { getClientByType, getValidClientTypes } from "../src/clients/client-detector.js";
import { installDirect } from "../src/core/direct-installer.js";
import { findBundle, findServer, resolveBundleServers, searchServers } from "../src/core/registry-loader.js";

test("supported client registry includes zed and gemini-cli", () => {
	const types = getValidClientTypes();
	for (const expected of [
		"claude-desktop",
		"cursor",
		"vscode",
		"windsurf",
		"claude-code",
		"zed",
		"gemini-cli",
	] as const) {
		assert.ok(types.includes(expected), `missing client ${expected}`);
	}
});

test("client handlers read/write expected config paths and root keys", () => {
	const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "mcphub-test-"));
	const prevHome = process.env["HOME"];
	const prevUserProfile = process.env["USERPROFILE"];
	const prevXdg = process.env["XDG_CONFIG_HOME"];
	process.env["HOME"] = tmpHome;
	process.env["USERPROFILE"] = tmpHome;
	delete process.env["XDG_CONFIG_HOME"];

	try {
		const gemini = getClientByType("gemini-cli");
		const zed = getClientByType("zed");

		const sampleEntry = { command: "npx", args: ["-y", "agent-qa", "mcp"] };
		gemini.addServer("agent-qa", sampleEntry);
		zed.addServer("agent-qa", sampleEntry);

		const geminiJson = JSON.parse(
			fs.readFileSync(path.join(tmpHome, ".gemini", "settings.json"), "utf-8"),
		);
		assert.deepEqual(geminiJson.mcpServers["agent-qa"], sampleEntry);

		const zedJson = JSON.parse(
			fs.readFileSync(path.join(tmpHome, ".config", "zed", "settings.json"), "utf-8"),
		);
		assert.deepEqual(zedJson.context_servers["agent-qa"], sampleEntry);

		assert.throws(() => gemini.addServer("__proto__", sampleEntry), /Invalid server name/);

		gemini.removeServer("agent-qa");
		assert.deepEqual(gemini.listServers(), {});
	} finally {
		if (prevHome === undefined) delete process.env["HOME"];
		else process.env["HOME"] = prevHome;
		if (prevUserProfile === undefined) delete process.env["USERPROFILE"];
		else process.env["USERPROFILE"] = prevUserProfile;
		if (prevXdg !== undefined) process.env["XDG_CONFIG_HOME"] = prevXdg;
		fs.rmSync(tmpHome, { recursive: true, force: true });
	}
});

test("installDirect writes to targeted client and reports unknown client cleanly", () => {
	const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "mcphub-direct-"));
	const prevHome = process.env["HOME"];
	const prevUserProfile = process.env["USERPROFILE"];
	process.env["HOME"] = tmpHome;
	process.env["USERPROFILE"] = tmpHome;

	try {
		const okResults = installDirect(
			"deeplead",
			{ command: "npx", args: ["-y", "mcp-remote", "https://www.deeplead.io/api/mcp"] },
			"gemini-cli",
		);
		assert.equal(okResults.length, 1);
		assert.equal(okResults[0]?.success, true);

		const badResults = installDirect(
			"deeplead",
			{ command: "npx", args: ["-y", "mcp-remote"] },
			"nonexistent" as never,
		);
		assert.equal(badResults.length, 1);
		assert.equal(badResults[0]?.success, false);
	} finally {
		if (prevHome === undefined) delete process.env["HOME"];
		else process.env["HOME"] = prevHome;
		if (prevUserProfile === undefined) delete process.env["USERPROFILE"];
		else process.env["USERPROFILE"] = prevUserProfile;
		fs.rmSync(tmpHome, { recursive: true, force: true });
	}
});

test("registry loader resolves newly contributed servers and bundles", () => {
	for (const name of ["agent-qa", "deeplead", "invokely-mcp-connector"]) {
		const entry = findServer(name);
		assert.ok(entry, `expected server ${name} in built registry index`);
	}

	const qaMatches = searchServers("testing");
	assert.ok(qaMatches.some((s) => s.name === "agent-qa"));

	const bundle = findBundle("web-developer");
	assert.ok(bundle, "expected web-developer bundle");
	const resolved = resolveBundleServers(bundle);
	assert.ok(resolved.length >= 5);
});
