import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const wrapper = process.platform === "win32" ? "gradlew.bat" : "./gradlew";
const env = { ...process.env };

if (process.platform === "win32") {
  const javaCandidates = [
    env.JAVA_HOME,
    path.join(env.ProgramFiles ?? "C:\\Program Files", "Android", "Android Studio", "jbr"),
    path.join(env.ProgramFiles ?? "C:\\Program Files", "Android", "Android Studio1", "jbr"),
  ].filter(Boolean);
  const javaHome = javaCandidates.find((candidate) =>
    fs.existsSync(path.join(candidate, "lib", "jvm.cfg")),
  );
  if (javaHome) env.JAVA_HOME = javaHome;
  if (!env.ANDROID_HOME && env.LOCALAPPDATA) {
    const sdk = path.join(env.LOCALAPPDATA, "Android", "Sdk");
    if (fs.existsSync(sdk)) env.ANDROID_HOME = sdk;
  }
}

const result = spawnSync(wrapper, process.argv.slice(2), {
  cwd: root,
  env,
  shell: process.platform === "win32",
  stdio: "inherit",
});
process.exit(result.status ?? 1);
