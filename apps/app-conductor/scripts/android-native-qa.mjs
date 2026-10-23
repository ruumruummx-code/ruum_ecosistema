#!/usr/bin/env node
// Recoge evidencia Android real. No declara PASS ni GO por ejecutar un preflight.
/* eslint-disable security/detect-non-literal-fs-filename -- Rutas locales indicadas por quien ejecuta la CLI; el identificador de caso se valida antes de crear archivos. */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const options = new Map();
while (args.length) {
  const key = args.shift();
  if (key === "--keyboard" || key === "--help") options.set(key, true);
  else if (["--serial", "--apk", "--case", "--output"].includes(key)) {
    const value = args.shift();
    if (!value || value.startsWith("--")) throw new Error(`Argumento sin valor: ${key}`);
    options.set(key, value);
  }
  else throw new Error(`Argumento no reconocido o sin valor: ${key}`);
}
if (options.get("--help")) {
  console.log("node scripts/android-native-qa.mjs [--serial SERIAL] [--apk APK] [--case login-correo --keyboard] [--output DIRECTORIO]");
  console.log("Sin --case: preflight. Con --case: captura solo Conductor en primer plano. No certifica GO.");
  process.exit(0);
}
const caseId = options.get("--case") ?? "preflight";
if (!/^[a-z0-9-]+$/.test(caseId)) throw new Error("--case solo admite letras minúsculas, números y guiones.");
const timestamp = new Date().toISOString();
const output = resolve(options.get("--output") ?? resolve(appRoot, "artifacts/android-native"), `${timestamp.replaceAll(/[:.]/g, "-")}-${caseId}`);
mkdirSync(output, { recursive: true });
const adb = process.env.RUUM_ADB_PATH || "adb";
const appId = "com.moviliax.ruumruum.conductor";
const report = { timestamp, caseId, appId, status: "BLOCKED", certification: "NO-GO", reasons: [], captures: [], device: null };
const run = (command, commandArgs, encoding = "utf8") => execFileSync(command, commandArgs, {
  cwd: appRoot, encoding, timeout: 20_000, maxBuffer: 16 * 1024 * 1024, windowsHide: true,
});
try {
  report.commit = run("git", ["rev-parse", "HEAD"]).trim();
  report.workingTreeDirty = Boolean(run("git", ["status", "--porcelain"]).trim());
  if (options.get("--apk")) {
    const apkPath = resolve(options.get("--apk"));
    report.apk = { path: apkPath, sha256: createHash("sha256").update(readFileSync(apkPath)).digest("hex") };
  }
  report.adbVersion = run(adb, ["version"]).split(/\r?\n/).slice(0, 2);
  const deviceList = run(adb, ["devices", "-l"]);
  report.devices = deviceList.split(/\r?\n/).flatMap(line => {
    const match = /^(\S+)\s+(device|offline|unauthorized)\b/.exec(line);
    return match ? [{ serial: match[1], state: match[2] }] : [];
  });
  const ready = report.devices.filter(device => device.state === "device");
  const serial = options.get("--serial") ?? (ready.length === 1 ? ready[0].serial : null);
  if (!serial || !ready.some(device => device.serial === serial)) throw new Error("Se requiere un único Android conectado y autorizado en estado device, o --serial explícito.");
  const shell = (...command) => run(adb, ["-s", serial, "shell", ...command]).trim();
  if (shell("getprop", "sys.boot_completed") !== "1") throw new Error("Android todavía no completó el arranque.");
  report.device = {
    serial, model: shell("getprop", "ro.product.model"), android: shell("getprop", "ro.build.version.release"),
    api: shell("getprop", "ro.build.version.sdk"), size: shell("wm", "size"), density: shell("wm", "density"),
    ime: shell("settings", "get", "secure", "default_input_method"),
    webView: shell("dumpsys", "webviewupdate").split(/\r?\n/).filter(line => /Current WebView package/.test(line)).map(line => line.trim()),
  };
  const ime = shell("dumpsys", "input_method");
  report.keyboard = {
    shown: /(?:mInputShown|mIsInputViewShown|isInputViewShown)\s*[=:]\s*true|mImeWindowVis\s*=\s*0x3\b/.test(ime),
    // No conservar el dump completo: puede contener información del editor activo.
    signals: ime.split(/\r?\n/).filter(line => /^\s*(?:mInputShown|mIsInputViewShown|mImeWindowVis)\s*[=:]/.test(line)).map(line => line.trim().slice(0, 200)),
  };
  if (options.get("--keyboard") && !report.keyboard.shown) throw new Error("No se pudo confirmar el teclado nativo desplegado. No sustituirlo con visualViewport simulado.");
  if (options.get("--case")) {
    if (!report.apk) throw new Error("La captura requiere --apk para identificar el artefacto candidato.");
    const installedPath = shell("pm", "path", appId).split(/\r?\n/).find(line => line.endsWith("/base.apk"))?.replace(/^package:/, "");
    if (!installedPath || !/^\/data\/app\/[\w./+=~-]+\.apk$/.test(installedPath)) throw new Error("No se pudo identificar el APK instalado de Conductor.");
    report.installedApkSha256 = shell("sha256sum", installedPath).split(/\s+/)[0];
    if (report.installedApkSha256 !== report.apk.sha256) throw new Error("El APK instalado no coincide con el candidato indicado.");
    const focus = shell("dumpsys", "window", "windows").split(/\r?\n/).find(line => /mCurrentFocus=/.test(line)) ?? "";
    if (!focus.includes(`${appId}/`)) throw new Error("Conductor debe estar en primer plano; no se capturan otras aplicaciones.");
    const png = run(adb, ["-s", serial, "exec-out", "screencap", "-p"], null);
    if (png.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error("La captura ADB no es un PNG válido.");
    writeFileSync(resolve(output, "screen.png"), png);
    report.captures.push("screen.png");
    report.status = "EVIDENCE_CAPTURED";
  } else report.status = "PREFLIGHT_READY";
  report.reasons.push("Pendiente revisar geometría, ejecutar la matriz y comprobar CI del mismo candidato. Este recolector no concede GO.");
} catch (error) {
  report.reasons.push(error instanceof Error ? error.message.split(/\r?\n/)[0] : "No se pudo recoger evidencia Android.");
}
writeFileSync(resolve(output, "report.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ status: report.status, certification: report.certification, report: resolve(output, "report.json"), reasons: report.reasons }, null, 2));
process.exitCode = report.status === "BLOCKED" ? 2 : 0;
