const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const HIDManager = require('./hid-manager');
const VideoServer = require('./video-server');

let mainWindow;
let hidManager;
let videoServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    show: false
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create menu
  const template = [
    {
      label: 'KVM Client',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

app.whenReady().then(() => {
  createWindow();
  
  // Initialize HID manager
  hidManager = new HIDManager();
  
  // Initialize video server
  videoServer = new VideoServer();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (hidManager) {
    hidManager.close();
  }
  if (videoServer) {
    videoServer.stop();
  }
});

// IPC handlers
ipcMain.handle('get-video-devices', async () => {
  return videoServer.getVideoDevices();
});

ipcMain.handle('start-video-stream', async (event, deviceId) => {
  return videoServer.startStream(deviceId);
});

ipcMain.handle('stop-video-stream', async () => {
  return videoServer.stopStream();
});

ipcMain.handle('get-hid-devices', async () => {
  return hidManager.getDevices();
});

ipcMain.handle('connect-hid-device', async (event, devicePath) => {
  return hidManager.connect(devicePath);
});

ipcMain.handle('disconnect-hid-device', async () => {
  return hidManager.disconnect();
});

ipcMain.handle('send-mouse-event', async (event, data) => {
  return hidManager.sendMouseEvent(data);
});

ipcMain.handle('send-keyboard-event', async (event, data) => {
  return hidManager.sendKeyboardEvent(data);
});

ipcMain.handle('get-stream-url', async () => {
  return videoServer.getStreamUrl();
});