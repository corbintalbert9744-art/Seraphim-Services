import { app, BrowserWindow, dialog } from "electron";
import { setDataDirectory } from "./storage.mjs";
import { startServer } from "./server.mjs";

const APP_ID = "com.seraphim.adminpanel";

let mainWindow = null;
let httpServer = null;

app.commandLine.appendSwitch("disable-gpu-sandbox");
app.commandLine.appendSwitch("disable-software-rasterizer");

if (process.platform === "win32") {
  app.setAppUserModelId(APP_ID);
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

async function createWindow() {
  const { server, port } = await startServer(0);
  httpServer = server;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Seraphim Admin Panel",
    backgroundColor: "#0a0a0a",
    autoHideMenuBar: true,
    show: true,
    center: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  const showWindow = () => {
    if (!mainWindow) return;
    mainWindow.show();
    mainWindow.focus();
  };

  mainWindow.once("ready-to-show", showWindow);
  setTimeout(showWindow, 1500);

  try {
    await mainWindow.loadURL(`http://127.0.0.1:${port}`);
  } catch (err) {
    dialog.showErrorBox(
      "Seraphim Admin Panel",
      `Failed to load the admin UI.\n\n${err?.message || err}`
    );
    app.quit();
    return;
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function shutdown() {
  if (httpServer) {
    httpServer.close();
    httpServer = null;
  }
}

if (gotLock) {
  app.whenReady().then(async () => {
    try {
      if (app.isPackaged) {
        setDataDirectory(app.getPath("userData"));
      }
      await createWindow();
    } catch (err) {
      dialog.showErrorBox(
        "Seraphim Admin Panel",
        `Failed to start.\n\n${err?.message || err}`
      );
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    shutdown();
    app.quit();
  });

  app.on("before-quit", shutdown);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}
