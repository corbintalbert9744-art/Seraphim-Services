const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("seraphim", {
  activateLicense: (key) => ipcRenderer.invoke("license:activate", key),
  licenseStatus: () => ipcRenderer.invoke("license:status"),
  startMacro: (profile) => ipcRenderer.invoke("macro:start", profile),
  stopMacro: () => ipcRenderer.invoke("macro:stop"),
  pingEngine: () => ipcRenderer.invoke("macro:ping"),
  onEngineEvent: (callback) => {
    const listener = (_event, data) => callback(data);
    ipcRenderer.on("engine-event", listener);
    return () => ipcRenderer.removeListener("engine-event", listener);
  },
});
