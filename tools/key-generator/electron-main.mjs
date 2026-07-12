import { app, BrowserWindow } from "electron";
import { startServer } from "./server.mjs";

let mainWindow = null;
let httpServer = null;
let serverPort = null;

async function createWindow() {
  const { server, port } = await startServer(0);
  httpServer = server;
  serverPort = port;

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    title: "Seraphim Admin Panel",
    backgroundColor: "#0a0a0a",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}`);

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

app.whenReady().then(createWindow);

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
