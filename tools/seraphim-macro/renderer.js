const logEl = document.getElementById("log");
const engineStatus = document.getElementById("engineStatus");
const licenseInfo = document.getElementById("licenseInfo");

function appendLog(line) {
  const stamp = new Date().toLocaleTimeString();
  logEl.textContent += `[${stamp}] ${line}\n`;
  logEl.scrollTop = logEl.scrollHeight;
}

async function refreshLicense() {
  try {
    const status = await window.seraphim.licenseStatus();
    if (status.valid) {
      const expiry = status.expiresAt ? ` · expires ${new Date(status.expiresAt).toLocaleDateString()}` : " · lifetime";
      licenseInfo.textContent = `Licensed · ${status.maxDevices} device(s)${expiry}`;
    }
  } catch (err) {
    licenseInfo.textContent = err.message;
  }
}

document.getElementById("startBtn").addEventListener("click", async () => {
  const profile = {
    name: document.getElementById("profileName").value.trim() || "Default Macro",
    keys: document.getElementById("profileKeys").value,
    loops: Number(document.getElementById("profileLoops").value) || 1,
    delayMs: Number(document.getElementById("profileDelay").value) || 100,
  };

  try {
    await window.seraphim.startMacro(profile);
    appendLog(`Started profile: ${profile.name}`);
  } catch (err) {
    appendLog(`Error: ${err.message}`);
  }
});

document.getElementById("stopBtn").addEventListener("click", async () => {
  await window.seraphim.stopMacro();
  appendLog("Stop requested");
});

window.seraphim.onEngineEvent((event) => {
  if (!event?.type) return;

  if (event.type === "ready") {
    engineStatus.textContent = `Engine ready (${event.mode || event.platform})`;
    appendLog(`Engine ready on ${event.platform}`);
    return;
  }

  if (event.type === "started") {
    engineStatus.textContent = "Running";
    appendLog(`Engine started: ${event.profile}`);
    return;
  }

  if (event.type === "loop") {
    appendLog(`Loop ${event.index}/${event.total}`);
    return;
  }

  if (event.type === "stopped") {
    engineStatus.textContent = "Engine idle";
    appendLog(`Stopped (${event.reason})`);
    return;
  }

  if (event.type === "error") {
    engineStatus.textContent = "Error";
    appendLog(`Error: ${event.message}`);
  }
});

refreshLicense();
window.seraphim.pingEngine();
