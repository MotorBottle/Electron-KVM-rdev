const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const HIDManager = require('./hid-manager');
const VideoServer = require('./video-server');

// Disable network services and SSL connections at startup
app.commandLine.appendSwitch('--disable-features', 'CertificateTransparencyComponentUpdater');
app.commandLine.appendSwitch('--disable-background-networking');
app.commandLine.appendSwitch('--disable-background-timer-throttling');
app.commandLine.appendSwitch('--disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('--disable-component-update');
app.commandLine.appendSwitch('--disable-default-apps');
app.commandLine.appendSwitch('--disable-ipc-flooding-protection');
app.commandLine.appendSwitch('--disable-web-security');
app.commandLine.appendSwitch('--disable-features', 'VizDisplayCompositor');
app.commandLine.appendSwitch('--disable-features', 'DnsOverHttps');
app.commandLine.appendSwitch('--disable-domain-reliability');

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
      preload: path.join(__dirname, 'preload.js'),
      // Disable network access for security and to prevent SSL errors
      webSecurity: true,
      allowRunningInsecureContent: false,
      // Disable additional web features that might make network requests
      experimentalFeatures: false
    },
    titleBarStyle: process.platform === 'darwin' ? 'default' : 'default',
    title: 'KVM Remote Control',
    show: false,
    // Try to prevent macOS from handling function keys
    alwaysOnTop: false,
    skipTaskbar: false
  });

  // Register global shortcuts to prevent macOS from intercepting them
  const { globalShortcut } = require('electron');
  
  // Register F3, F11, and ESC to prevent system capture and forward to renderer
  // Try multiple registration approaches for F3 and F11
  const keysToRegister = ['F3', 'F11', 'Escape'];
  
  keysToRegister.forEach(key => {
    try {
      globalShortcut.register(key, () => {
        console.log(`Global shortcut triggered: ${key}`);
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('global-key-pressed', { key, code: key });
        }
      });
      console.log(`Successfully registered global shortcut: ${key}`);
    } catch (error) {
      console.error(`Failed to register global shortcut ${key}:`, error);
    }
  });
  
  // Try alternative combinations that might work better on macOS
  const alternativeShortcuts = [
    'Alt+F3', 'Shift+F3', 'Control+F3',
    'Alt+F11', 'Shift+F11', 'Control+F11',
    'CommandOrControl+F11'
  ];
  
  alternativeShortcuts.forEach(shortcut => {
    try {
      globalShortcut.register(shortcut, () => {
        const key = shortcut.includes('F3') ? 'F3' : 'F11';
        console.log(`Alternative shortcut triggered: ${shortcut} -> ${key}`);
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('global-key-pressed', { key, code: key });
        }
      });
    } catch (error) {
      // Silently ignore alternative registration failures
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Set up webContents-level key interception
  mainWindow.webContents.on('before-input-event', (event, input) => {
    // Intercept F3, F11 when they might not be caught by global shortcuts
    if (input.type === 'keyDown' && ['F3', 'F11'].includes(input.key)) {
      console.log(`WebContents intercepted: ${input.key}`);
      mainWindow.webContents.send('global-key-pressed', { 
        key: input.key, 
        code: input.code || input.key 
      });
      // Don't prevent the event, let it also go to the renderer
    }
  });
  
  // Additional attempt: try to capture all key events and filter for F3/F11
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow.webContents.executeJavaScript(`
      // Additional client-side interception
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F3' || e.key === 'F11') {
          console.log('DOM intercepted:', e.key);
          window.electronAPI?.onGlobalKeyPressed?.(null, { key: e.key, code: e.code });
        }
      }, true);
    `);
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Try to re-register shortcuts when window gets focus
  mainWindow.on('focus', () => {
    console.log('Window focused, attempting to re-register F3/F11');
    try {
      // Unregister and re-register to ensure they're active
      globalShortcut.unregister('F3');
      globalShortcut.unregister('F11');
      
      globalShortcut.register('F3', () => {
        console.log('F3 triggered on focus');
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('global-key-pressed', { key: 'F3', code: 'F3' });
        }
      });
      
      globalShortcut.register('F11', () => {
        console.log('F11 triggered on focus');
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('global-key-pressed', { key: 'F11', code: 'F11' });
        }
      });
    } catch (error) {
      console.log('Focus re-registration failed:', error.message);
    }
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
  // Set app user model ID for Windows
  app.setAppUserModelId('com.motorbottle.kvm-client');
  
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
  // Unregister global shortcuts
  const { globalShortcut } = require('electron');
  globalShortcut.unregisterAll();
  
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

ipcMain.handle('toggle-fullscreen', async () => {
  if (mainWindow) {
    const isFullscreen = mainWindow.isFullScreen();
    mainWindow.setFullScreen(!isFullscreen);
    
    // Hide menu bar on Windows when fullscreen
    if (process.platform === 'win32') {
      mainWindow.setMenuBarVisibility(isFullscreen);
    }
    
    return !isFullscreen;
  }
  return false;
});