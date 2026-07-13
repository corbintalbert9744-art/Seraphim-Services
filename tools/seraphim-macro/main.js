import { app, BrowserWindow, dialog, ipcMain, utilityProcess } from "electron";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { validateLicenseKey } from "./license-check.js";
import { loadStoredLicense, saveLicense } from "./license-store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_ID = "com.seraphim.macro";

let licenseWindow = null;
let macroWindow = null;
let macroEngine = null;
let engineMode = "utility";
let activeLicense = null;

app.commandLine.appendSwitch("disable-gpu-sandbox");

if (process.platform === "win32") {
  app.setAppUserModelId(APP_ID);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
}

function getEnginePath() {
  if (app.isPackaged) {
    return join(process.resourcesPath, "macro-engine.js");
  }
  return join(__dirname, "macro-engine.js");
}

function sendToEngine(message) {
  if (engineMode === "utility" && macroEngine) {
    macroEngine.postMessage(message);
    return;
  }

  if (engineMode === "in-process") {
    handleEngineMessage(message).catch((err) => {
      broadcastEngineEvent({ type: "error", message: err?.message || String(err) });
    });
  }
}

async function handleEngineMessage(message) {
  if (message?.type === "start") {
    broadcastEngineEvent({ type: "started", profile: message.profile?.name || "default" });
    const loops = Number(message.profile?.loops) || 1;
    for (let i = 0; i < loops; i += 1) {
      broadcastEngineEvent({ type: "loop", index: i + 1, total: loops });
      await new Promise((resolve) => setTimeout(resolve, Number(message.profile?.delayMs) || 50));
    }
    broadcastEngineEvent({ type: "stopped", reason: "completed" });
  }
}

function broadcastEngineEvent(payload) {
  if (macroWindow && !macroWindow.isDestroyed()) {
    macroWindow.webContents.send("engine-event", payload);
  }
}

function startMacroEngine() {
  if (macroEngine) return;

  const needsHeadlessFallback =
    process.platform === "linux" && !process.env.DISPLAY && !process.env.WAYLAND_DISPLAY;

  if (needsHeadlessFallback) {
    engineMode = "in-process";
    broadcastEngineEvent({ type: "ready", platform: process.platform, mode: "in-process" });
    return;
  }

  engineMode = "utility";
  macroEngine = utilityProcess.fork(getEnginePath(), [], {
    serviceName: "seraphim-macro-engine",
    env: {
      ...process.env,
      SERAPHIM_HEADLESS: "1",
      ELECTRON_NO_ATTACH_CONSOLE: "1",
    },
  });

  macroEngine.on("message", (msg) => broadcastEngineEvent(msg));
  macroEngine.on("exit", () => {
    macroEngine = null;
  });
}

function requireValidLicense(key) {
  const result = validateLicenseKey(key);
  if (!result.valid) {
    throw new Error(result.reason || "Invalid license key");
  }
  return result;
}

async function createLicenseWindow() {
  licenseWindow = new BrowserWindow({
    width: 520,
    height: 420,
    resizable: false,
    title: "Seraphim Macro — Activate",
    backgroundColor: "#0a0a0a",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await licenseWindow.loadFile(join(__dirname, "license.html"));
}

async function createMacroWindow() {
  macroWindow = new BrowserWindow({
    width: 960,
    height: 640,
    minWidth: 800,
    minHeight: 520,
    title: "Seraphim Macro v1.0.4",
    backgroundColor: "#0a0a0a",
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  await macroWindow.loadFile(join(__dirname, "index.html"));
  startMacroEngine();
}

async function boot() {
  const stored = await loadStoredLicense(app.getPath("userData"));

  if (stored) {
    try {
      activeLicense = requireValidLicense(stored);
      await createMacroWindow();
      return;
    } catch {
      await saveLicense(app.getPath("userData"), "");
    }
  }

  await createLicenseWindow();
}

if (gotLock) {
  app.whenReady().then(async () => {
    try {
      await boot();
    } catch (err) {
      dialog.showErrorBox("Seraphim Macro", err?.message || String(err));
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (macroEngine) {
      macroEngine.kill();
      macroEngine = null;
    }
    app.quit();
  });

  app.on("activate", async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await boot();
    }
  });
}

ipcMain.handle("license:activate", async (_event, licenseKey) => {
  const result = requireValidLicense(licenseKey);
  await saveLicense(app.getPath("userData"), licenseKey);
  activeLicense = result;

  if (licenseWindow && !licenseWindow.isDestroyed()) {
    licenseWindow.close();
    licenseWindow = null;
  }

  if (!macroWindow) {
    await createMacroWindow();
  }

  return { ok: true, ...result };
});

ipcMain.handle("license:status", async () => {
  if (!activeLicense) {
    const stored = await loadStoredLicense(app.getPath("userData"));
    if (!stored) return { valid: false };
    activeLicense = requireValidLicense(stored);
  }
  return { valid: true, ...activeLicense };
});

ipcMain.handle("macro:start", async (_event, profile) => {
  if (!activeLicense) {
    throw new Error("No active license");
  }
  sendToEngine({ type: "start", profile });
  return { ok: true };
});

ipcMain.handle("macro:stop", async () => {
  sendToEngine({ type: "stop" });
  return { ok: true };
});

ipcMain.handle("macro:ping", async () => {
  sendToEngine({ type: "ping" });
  return { ok: true };
});
