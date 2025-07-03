const HID = require('node-hid');

class HIDManager {
  constructor() {
    this.device = null;
    this.connected = false;
    this.vendorId = 0x413D;
    this.productId = 0x2107;
    this.usagePage = 0xFF00;
  }

  getDevices() {
    try {
      const devices = HID.devices();
      return devices.filter(device => 
        device.vendorId === this.vendorId && 
        device.productId === this.productId &&
        device.usagePage === this.usagePage
      );
    } catch (error) {
      console.error('Error getting HID devices:', error);
      return [];
    }
  }

  connect(devicePath) {
    try {
      if (this.device) {
        this.device.close();
      }

      this.device = new HID.HID(devicePath);
      this.device.setNonBlocking(true);
      this.connected = true;
      
      console.log('Connected to HID device:', devicePath);
      return { success: true };
    } catch (error) {
      console.error('Error connecting to HID device:', error);
      this.connected = false;
      return { success: false, error: error.message };
    }
  }

  disconnect() {
    try {
      if (this.device) {
        this.device.close();
        this.device = null;
      }
      this.connected = false;
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting HID device:', error);
      return { success: false, error: error.message };
    }
  }

  sendMouseEvent(data) {
    if (!this.connected || !this.device) {
      return { success: false, error: 'Device not connected' };
    }

    try {
      let buffer = [2, 0, 0, 0, 0, 0, 0, 0, 0]; // Mouse buffer format from original

      switch (data.type) {
        case 'move':
          buffer = [7, 0, 0, data.x & 0xFF, (data.x >> 8) & 0xFF, data.y & 0xFF, (data.y >> 8) & 0xFF, 0, 0];
          break;
        case 'abs':
          buffer[1] = 1; // Absolute positioning flag
          buffer[2] = data.x & 0xFF;
          buffer[3] = (data.x >> 8) & 0xFF;
          buffer[4] = data.y & 0xFF;
          buffer[5] = (data.y >> 8) & 0xFF;
          break;
        case 'mousedown':
          buffer[1] = this.getMouseButtonCode(data.button);
          buffer[2] = 2; // Button down
          break;
        case 'mouseup':
          buffer[1] = this.getMouseButtonCode(data.button);
          buffer[2] = 3; // Button up
          break;
        case 'wheel':
          buffer[1] = Math.round(data.delta / 40);
          buffer[2] = 4; // Wheel
          break;
        case 'reset':
          buffer[2] = 1; // Reset
          break;
      }

      // Rotate buffer (move first element to end, prepend with 0)
      const rotatedBuffer = [0, ...buffer.slice(1), buffer[0]];
      
      this.device.write(rotatedBuffer);
      return { success: true };
    } catch (error) {
      console.error('Error sending mouse event:', error);
      return { success: false, error: error.message };
    }
  }

  sendKeyboardEvent(data) {
    if (!this.connected || !this.device) {
      return { success: false, error: 'Device not connected' };
    }

    try {
      let buffer = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Keyboard buffer format from original

      if (data.type === 'keydown') {
        buffer[2] = 1;
      } else if (data.type === 'keyup') {
        buffer[2] = 2;
      } else if (data.type === 'reset') {
        buffer[2] = 3;
      }

      if (data.type !== 'reset') {
        buffer[1] = this.getKeyCode(data.key);
      }

      // Rotate buffer (move first element to end, prepend with 0)
      const rotatedBuffer = [0, ...buffer.slice(1), buffer[0]];
      
      this.device.write(rotatedBuffer);
      return { success: true };
    } catch (error) {
      console.error('Error sending keyboard event:', error);
      return { success: false, error: error.message };
    }
  }

  getMouseButtonCode(button) {
    const buttonMap = {
      0: 1,  // Left
      1: 4,  // Middle
      2: 2,  // Right
      3: 8,  // Back
      4: 16  // Forward
    };
    return buttonMap[button] || 1;
  }

  getKeyCode(key) {
    // Key mapping based on original keyboard mapping
    const keyMap = {
      'Control': 0xE0, 'Shift': 0xE1, 'Alt': 0xE2, 'Meta': 0xE3,
      'Tab': 0x2B, 'CapsLock': 0x39, 'Backspace': 0x2A, 'Enter': 0x28,
      'Insert': 0x49, 'Delete': 0x4C, 'Home': 0x4A, 'End': 0x4D,
      'PageUp': 0x4B, 'PageDown': 0x4E, 'ArrowUp': 0x52, 'ArrowDown': 0x51,
      'ArrowLeft': 0x50, 'ArrowRight': 0x4F, 'Escape': 0x29, ' ': 0x2C,
      '`': 0x35, ';': 0x33, "'": 0x34, '[': 0x2F, ']': 0x30, '\\': 0x31,
      '-': 0x2D, '=': 0x2E, ',': 0x36, '.': 0x37, '/': 0x38
    };

    // Numbers
    for (let i = 0; i <= 9; i++) {
      keyMap[i.toString()] = 0x1E + i - 1;
    }
    keyMap['0'] = 0x27;

    // Letters (a-z, A-Z)
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(97 + i); // a-z
      const upperLetter = String.fromCharCode(65 + i); // A-Z
      keyMap[letter] = 0x04 + i;
      keyMap[upperLetter] = 0x04 + i;
    }

    // Function keys
    for (let i = 1; i <= 12; i++) {
      keyMap[`F${i}`] = 0x3A + i - 1;
    }

    return keyMap[key] || 0;
  }

  close() {
    if (this.device) {
      this.device.close();
      this.device = null;
    }
    this.connected = false;
  }
}

module.exports = HIDManager;