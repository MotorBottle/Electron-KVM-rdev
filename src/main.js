const { app, BrowserWindow, ipcMain, Menu, globalShortcut } = require('electron');
const path = require('path');
const HIDManager = require('./hid-manager');
const VideoServer = require('./video-server');

let rdevGrabber = null;
let rdevRunning = false;
let isInControlMode = false;
let isWindowFocused = false;

// Start/stop rdev grab based on focus + control state
function updateGrabState() {
  const shouldGrab = isInControlMode && isWindowFocused;
  console.log('updateGrabState', { shouldGrab, isInControlMode, isWindowFocused, rdevRunning });
  if (shouldGrab && !rdevRunning && rdevGrabber && typeof rdevGrabber.start_grab === 'function') {
    // Check permissions before starting grab (macOS requirement)
    if (!checkMacOSPermissions()) {
      console.error('Cannot start keyboard grab: macOS permissions not granted');
      return;
    }

    try {
      rdevGrabber.start_grab((event) => {
        if (!event) {
          console.warn('rdev callback received null event');
          return;
        }

        // Normalize event data from rdev
        const payload = {
          key: event.key || 'Unknown',
          code: event.code || event.key || '',
          eventType: event.event_type || event.eventType || 'down',
          ctrlKey: !!(event.ctrl ?? event.ctrlKey),
          altKey: !!(event.alt ?? event.altKey),
          shiftKey: !!(event.shift ?? event.shiftKey),
          metaKey: !!(event.meta ?? event.metaKey),
          platformCode: event.platform_code ?? event.platformCode ?? null,
          scanCode: event.scan_code ?? event.scanCode ?? null,
          usbHid: event.usb_hid ?? event.usbHid ?? null,
        };

        console.log('━━━ RDEV EVENT ━━━', {
          type: payload.eventType,
          key: payload.key,
          code: payload.code,
          usbHid: payload.usbHid,
          modifiers: {
            ctrl: payload.ctrlKey,
            alt: payload.altKey,
            shift: payload.shiftKey,
            meta: payload.metaKey
          },
          isInControlMode,
          hidConnected: hidManager?.connected
        });

        // In control mode: send directly to HID
        if (isInControlMode && hidManager && hidManager.connected) {
          console.log('→ Sending to HID:', payload.key, payload.code);
          const result = hidManager.sendKeyboardEvent({
            type: payload.eventType === 'up' ? 'keyup' : 'keydown',
            key: payload.key,
            code: payload.code,
            usbHid: payload.usbHid,
            scanCode: payload.scanCode,
            platformCode: payload.platformCode,
            metaKey: payload.metaKey,
            ctrlKey: payload.ctrlKey,
            altKey: payload.altKey,
            shiftKey: payload.shiftKey,
          });
          if (!result.success) {
            console.error('✗ HID send failed:', result.error);
          }
        } else {
          console.log('✗ Not sending to HID:', { isInControlMode, hidConnected: hidManager?.connected });
        }

        // Also send to renderer for quit key detection
        if (mainWindow && mainWindow.webContents) {
          mainWindow.webContents.send('global-key-pressed', payload);
        }
      });
      rdevRunning = true;
      console.log('✓ rdev grab started - capturing keyboard events');
    } catch (err) {
      console.error('Failed to start rdev grabber:', err);
    }
  } else if (!shouldGrab && rdevRunning && rdevGrabber && typeof rdevGrabber.stop_grab === 'function') {
    try {
      rdevGrabber.stop_grab();
    } catch (err) {
      console.warn('Failed to stop rdev grabber:', err);
    }
    rdevRunning = false;
    console.log('✓ rdev grab stopped - keyboard released');
  } else if (shouldGrab && rdevRunning) {
    console.log('⚠ rdev already running');
  } else if (!shouldGrab && !rdevRunning) {
    console.log('⚠ rdev already stopped');
  }
}

try {
  const grabberPath = path.join(__dirname, '..', 'native', 'rdev-grabber');
  rdevGrabber = require(grabberPath);
  console.log('rdev-grabber loaded from', grabberPath);
} catch (e) {
  console.warn('rdev-grabber native module not loaded; system hotkeys will not be blocked. Build it via npm run build:native. Error:', e.message);
}

// Check macOS permissions (following RustDesk's approach)
function checkMacOSPermissions() {
  if (process.platform !== 'darwin') {
    return true;
  }

  const { systemPreferences } = require('electron');

  // Check for Input Monitoring permission (required for keyboard capture on macOS 10.15+)
  const hasInputMonitoring = systemPreferences.isTrustedAccessibilityClient(false);

  if (!hasInputMonitoring) {
    console.warn('⚠️  PERMISSION REQUIRED: Input Monitoring / Accessibility access is not granted!');
    console.warn('');
    console.warn('To enable keyboard capture on macOS:');
    console.warn('1. Open System Settings → Privacy & Security → Accessibility');
    console.warn('2. Add "KVM Client" or "Electron" to the list');
    console.warn('3. Restart the application');
    console.warn('');
    console.warn('Alternatively, the app will prompt you when you try to use keyboard capture.');

    // Show system prompt to request permission
    setTimeout(() => {
      systemPreferences.isTrustedAccessibilityClient(true); // true = show prompt
    }, 1000);

    return false;
  }

  console.log('✅ macOS permissions granted: Input Monitoring / Accessibility');
  return true;
}

// Disable network services and SSL connections at startup (guarded for safety)
if (app && app.commandLine) {
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
}

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

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Track focus to manage grab state
  mainWindow.on('focus', () => {
    isWindowFocused = true;
    console.log('Window focused');
    updateGrabState();
  });

  mainWindow.on('blur', () => {
    isWindowFocused = false;
    console.log('Window blurred');
    updateGrabState();
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

  // Check macOS permissions on startup
  checkMacOSPermissions();

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

  app.on('browser-window-focus', () => {
    isWindowFocused = true;
    console.log('Browser window focused');
    updateGrabState();
  });

  app.on('browser-window-blur', () => {
    isWindowFocused = false;
    console.log('Browser window blurred');
    updateGrabState();
  });

  mainWindow.on('close', () => {
    console.log('Window closing, stopping grab and cleaning up');
    // Stop grab when window closes
    if (rdevGrabber && typeof rdevGrabber.stop_grab === 'function' && rdevRunning) {
      try {
        rdevGrabber.stop_grab();
        rdevRunning = false;
        console.log('✓ rdev grab stopped on window close');
      } catch (err) {
        console.warn('Failed to stop rdev grabber on window close:', err);
      }
    }
    // On macOS, quit the app when window closes (better UX for single-window app)
    if (process.platform === 'darwin') {
      app.quit();
    }
  });
});

app.on('window-all-closed', () => {
  // Always quit when all windows are closed (including macOS)
  app.quit();
});

app.on('before-quit', () => {
  // Unregister global shortcuts
  globalShortcut.unregisterAll();
  
  if (rdevGrabber && typeof rdevGrabber.stop_grab === 'function') {
    try {
      rdevGrabber.stop_grab();
    } catch (err) {
      console.warn('Failed to stop rdev grabber:', err);
    }
  }

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

// Handle control mode changes - starts/stops rdev keyboard grabbing
ipcMain.handle('set-control-mode', async (_, inControlMode) => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('SET CONTROL MODE:', inControlMode);
  console.log('Current state:', { isInControlMode, isWindowFocused, rdevRunning });
  isInControlMode = inControlMode;
  updateGrabState();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  return true;
});
