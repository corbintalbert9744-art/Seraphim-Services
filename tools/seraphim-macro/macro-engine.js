import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

let running = false;
let stopRequested = false;

async function delay(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendWindowsKeys(sequence) {
  const escaped = String(sequence).replace(/'/g, "''");
  const script = [
    "Add-Type -AssemblyName System.Windows.Forms",
    `[System.Windows.Forms.SendKeys]::SendWait('${escaped}')`,
  ].join("; ");

  await execFileAsync(
    "powershell.exe",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { windowsHide: true }
  );
}

async function runMacro(profile) {
  if (running) {
    post({ type: "error", message: "Macro already running" });
    return;
  }

  running = true;
  stopRequested = false;
  post({ type: "started", profile: profile?.name || "default" });

  try {
    const loops = Number(profile?.loops) || 1;
    const delayMs = Number(profile?.delayMs) || 50;
    const keys = String(profile?.keys || "{ENTER}");

    for (let i = 0; i < loops && !stopRequested; i += 1) {
      if (process.platform === "win32") {
        await sendWindowsKeys(keys);
      } else {
        post({ type: "log", message: `Would send keys: ${keys}` });
      }

      post({ type: "loop", index: i + 1, total: loops });
      if (i < loops - 1) await delay(delayMs);
    }

    post({ type: "stopped", reason: stopRequested ? "cancelled" : "completed" });
  } catch (err) {
    post({ type: "error", message: err?.message || String(err) });
  } finally {
    running = false;
    stopRequested = false;
  }
}

function post(payload) {
  if (process.parentPort) {
    process.parentPort.postMessage(payload);
  }
}

if (process.parentPort) {
  process.parentPort.on("message", async (event) => {
    const msg = event?.data || event;

    if (msg?.type === "start") {
      await runMacro(msg.profile);
      return;
    }

    if (msg?.type === "stop") {
      stopRequested = true;
      post({ type: "stopping" });
      return;
    }

    if (msg?.type === "ping") {
      post({ type: "pong", platform: process.platform });
    }
  });

  post({ type: "ready", platform: process.platform });
}
