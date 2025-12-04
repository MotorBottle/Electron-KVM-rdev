const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Video API
  getVideoDevices: () => ipcRenderer.invoke('get-video-devices'),
  startVideoStream: (deviceId) => ipcRenderer.invoke('start-video-stream', deviceId),
  stopVideoStream: () => ipcRenderer.invoke('stop-video-stream'),
  getStreamUrl: () => ipcRenderer.invoke('get-stream-url'),
  
  // HID API
  getHIDDevices: () => ipcRenderer.invoke('get-hid-devices'),
  connectHIDDevice: (devicePath) => ipcRenderer.invoke('connect-hid-device', devicePath),
  disconnectHIDDevice: () => ipcRenderer.invoke('disconnect-hid-device'),
  sendMouseEvent: (data) => ipcRenderer.invoke('send-mouse-event', data),
  sendKeyboardEvent: (data) => ipcRenderer.invoke('send-keyboard-event', data),
  
  // Global key events from main process
  onGlobalKeyPressed: (callback) => ipcRenderer.on('global-key-pressed', callback),
  
  // Window controls
  toggleFullscreen: () => ipcRenderer.invoke('toggle-fullscreen'),
  setControlMode: (inControlMode) => ipcRenderer.invoke('set-control-mode', inControlMode)
});