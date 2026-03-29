import { execSync, spawnSync } from "node:child_process";

/**
 * Checks whether mcpman is available on PATH.
 * Uses `which` on Unix and `where` on Windows.
 */
export function isMcpmanInstalled(): boolean {
  try {
    const cmd = process.platform === "win32" ? "where mcpman" : "which mcpman";
    execSync(cmd, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Delegates install to mcpman CLI.
 * Spawns: mcpman install <package> --yes
 * Returns true on success, false on failure.
 */
export function delegateToMcpman(packageName: string): boolean {
  // Validate package name to prevent shell injection
  if (!/^[@a-z0-9][\w./@-]*$/i.test(packageName)) {
    return false;
  }
  const result = spawnSync("mcpman", ["install", packageName, "--yes"], {
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    return false;
  }

  return result.status === 0;
}
