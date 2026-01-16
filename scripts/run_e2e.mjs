import { spawnSync } from "node:child_process";
import process from "node:process";

if (
  process.platform === "darwin" &&
  process.arch === "arm64" &&
  !process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE
) {
  process.env.PLAYWRIGHT_HOST_PLATFORM_OVERRIDE = "mac-arm64";
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const args = ["playwright", "test", ...process.argv.slice(2)];

const result = spawnSync(npxCommand, args, {
  stdio: "inherit",
  env: process.env,
});

process.exit(result.status ?? 1);
