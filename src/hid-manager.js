const HID = require('node-hid');

class HIDManager {
  constructor() {
    this.device = null;
    this.connected = false;
    this.vendorId = 0x413D;
    this.productId = 0x2107;
    this.usagePage = 0xFF00;
    
    // Track current modifier and key states
    this.modifierState = 0;
    this.activeKeys = new Set(); // Track which keys are currently pressed
    
    // Track last known mouse position and button state
    this.lastX = 0;
    this.lastY = 0;
    this.currentButtonState = 0; // Track currently pressed mouse buttons
  }

  getDevices() {
    try {
      const devices = HID.devices();
      console.log('All HID devices:', devices.map(d => ({
        path: d.path,
        vendorId: d.vendorId,
        productId: d.productId,
        usagePage: d.usagePage,
        product: d.product
      })));
      
      // First try with specific filters
      let filteredDevices = devices.filter(device => 
        device.vendorId === this.vendorId && 
        device.productId === this.productId &&
        device.usagePage === this.usagePage
      );
      
      // If no devices found with usage page filter, try without it
      if (filteredDevices.length === 0) {
        filteredDevices = devices.filter(device => 
          device.vendorId === this.vendorId && 
          device.productId === this.productId
        );
        console.log('Fallback: devices without usagePage filter:', filteredDevices);
      }
      
      // Also include any OSRBOT devices for debugging
      const osrbotDevices = devices.filter(device => 
        device.product && device.product.includes('OSRBOT')
      );
      console.log('OSRBOT devices found:', osrbotDevices);
      
      return filteredDevices;
    } catch (error) {
      console.error('Error getting HID devices:', error);
      return [];
    }
  }

  async connect(devicePath) {
    try {
      if (this.device) {
        this.device.close();
        this.device = null;
      }

      // Wait a bit for previous connection to close
      await new Promise(resolve => setTimeout(resolve, 200));
      
      this.device = new HID.HID(devicePath);
      this.connected = true;
      
      console.log('Connected to HID device:', devicePath);
      console.log('Device info:', this.device.getDeviceInfo());
      
      return { success: true };
    } catch (error) {
      console.error('Error connecting to HID device:', error);
      this.connected = false;
      
      // Try alternative connection method for macOS
      if (error.message.includes('native callback') || error.message.includes('cannot open device')) {
        console.log('Trying alternative connection method...');
        try {
          // Try opening with just vendor/product ID instead of path
          const devices = HID.devices();
          const targetDevice = devices.find(d => 
            d.vendorId === this.vendorId && 
            d.productId === this.productId &&
            d.usagePage === this.usagePage
          );
          
          if (targetDevice) {
            this.device = new HID.HID(this.vendorId, this.productId);
            this.connected = true;
            console.log('Connected using vendor/product ID method');
            return { success: true };
          }
        } catch (altError) {
          console.error('Alternative connection failed:', altError);
        }
      }
      
      return { success: false, error: `${error.message}. Make sure Electron has Input Monitoring permissions in System Preferences > Security & Privacy > Privacy > Input Monitoring` };
    }
  }

  disconnect() {
    try {
      if (this.device) {
        this.device.close();
        this.device = null;
      }
      this.connected = false;
      
      // Reset key states
      this.modifierState = 0;
      this.activeKeys.clear();
      
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
      let buffer;

      switch (data.type) {
        case 'move':
          const deltaX = Math.max(-127, Math.min(127, data.x));
          const deltaY = Math.max(-127, Math.min(127, data.y));
          const deltaX_byte = deltaX < 0 ? (256 + deltaX) : deltaX;
          const deltaY_byte = deltaY < 0 ? (256 + deltaY) : deltaY;
          // Include button state for dragging support in relative mode
          const moveButtonState = data.buttonsPressed !== undefined ? data.buttonsPressed : 0;
          if (data.buttonsPressed !== undefined) {
            this.currentButtonState = data.buttonsPressed;
          }
          buffer = [7, 0, moveButtonState, deltaX_byte, deltaY_byte, 0, 0, 0, 0];
          break;
        case 'abs':
          const x_scaled = Math.max(0, Math.min(0x7FFF, data.x));
          const y_scaled = Math.max(0, Math.min(0x7FFF, data.y));
          const buttonState = data.buttonsPressed || 0;
          const x_int = Math.round(x_scaled);
          const y_int = Math.round(y_scaled);
          const x_low = x_int & 0xFF;
          const x_high = (x_int >> 8) & 0x7F;
          const y_low = y_int & 0xFF;
          const y_high = (y_int >> 8) & 0x7F;
          buffer = [2, 0, buttonState, x_low, x_high, y_low, y_high, 0, 0];
          break;
        case 'mousedown':
        case 'mouseup':
          const clickButtonState = data.buttonsPressed !== undefined ? data.buttonsPressed :
            (data.type === 'mousedown' ? this.getMouseButtonCode(data.button) : 0);
          this.currentButtonState = clickButtonState;

          // If position is provided (absolute mode), send absolute positioning
          // If no position (relative mode), send relative positioning with no movement
          if (data.x !== undefined && data.y !== undefined) {
            // Absolute mode: Send click with position
            const click_x = Math.max(0, Math.min(0x7FFF, data.x));
            const click_y = Math.max(0, Math.min(0x7FFF, data.y));
            this.lastX = click_x;
            this.lastY = click_y;
            const click_x_int = Math.round(click_x);
            const click_y_int = Math.round(click_y);
            const click_x_low = click_x_int & 0xFF;
            const click_x_high = (click_x_int >> 8) & 0x7F;
            const click_y_low = click_y_int & 0xFF;
            const click_y_high = (click_y_int >> 8) & 0x7F;
            buffer = [2, 0, clickButtonState, click_x_low, click_x_high, click_y_low, click_y_high, 0, 0];
          } else {
            // Relative mode: Send click with no movement (delta = 0)
            // Use relative protocol (report ID 7) with zero deltas
            buffer = [7, 0, clickButtonState, 0, 0, 0, 0, 0, 0];
          }
          break;
        case 'wheel':
          const wheel_x = data.x !== undefined ? Math.max(0, Math.min(0x7FFF, data.x)) : (this.lastX || 0);
          const wheel_y = data.y !== undefined ? Math.max(0, Math.min(0x7FFF, data.y)) : (this.lastY || 0);
          if (data.x !== undefined) this.lastX = wheel_x;
          if (data.y !== undefined) this.lastY = wheel_y;
          const wheel_x_int = Math.round(wheel_x);
          const wheel_y_int = Math.round(wheel_y);
          const wheel_x_low = wheel_x_int & 0xFF;
          const wheel_x_high = (wheel_x_int >> 8) & 0x7F;
          const wheel_y_low = wheel_y_int & 0xFF;
          const wheel_y_high = (wheel_y_int >> 8) & 0x7F;
          const wheelDelta = Math.max(-127, Math.min(127, Math.round(data.delta / 120)));
          const wheelButtonState = data.buttonsPressed !== undefined ? data.buttonsPressed : this.currentButtonState;
          if (data.buttonsPressed !== undefined) {
            this.currentButtonState = data.buttonsPressed;
          }
          buffer = [2, 0, wheelButtonState, wheel_x_low, wheel_x_high, wheel_y_low, wheel_y_high, wheelDelta, 0];
          break;
        case 'reset':
          this.currentButtonState = 0;
          this.lastX = 0;
          this.lastY = 0;
          buffer = [2, 0, 0, 0, 0, 0, 0, 0, 0];
          break;
        default:
          buffer = [2, 0, 0, 0, 0, 0, 0, 0, 0];
      }

      const rotatedBuffer = [buffer[8], ...buffer.slice(0, 8)];
      rotatedBuffer[0] = 0;
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
      // Keyboard HID report: [report_id, reserved, modifier_byte, reserved, key1-6, reserved]
      let buffer = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

      if (data.type === 'reset') {
        // Reset all keys and internal state
        this.modifierState = 0;
        this.activeKeys.clear();
        console.log('Keyboard reset');
      } else if (data.type === 'keydown') {
        const modifierCode = this.getModifierCode(data.key, data.code);

        if (modifierCode > 0) {
          // Modifier key press
          this.modifierState |= modifierCode;
          console.log('Modifier DOWN:', data.key, 'state:', this.modifierState.toString(2).padStart(8, '0'));
        } else {
          // Regular key press
          const keyCode = this.getKeyCode(data.key, data.code, data.usbHid, data.scanCode, data.platformCode);
          if (keyCode > 0) {
            this.activeKeys.add(keyCode);
            console.log('Key DOWN:', data.key, 'code:0x' + keyCode.toString(16));
          } else {
            console.warn('Unknown key:', data.key, data.code);
          }
        }
      } else if (data.type === 'keyup') {
        const modifierCode = this.getModifierCode(data.key, data.code);

        if (modifierCode > 0) {
          // Modifier key release
          this.modifierState &= ~modifierCode;
          console.log('Modifier UP:', data.key, 'state:', this.modifierState.toString(2).padStart(8, '0'));
        } else {
          // Regular key release
          const keyCode = this.getKeyCode(data.key, data.code, data.usbHid, data.scanCode, data.platformCode);
          if (keyCode > 0) {
            this.activeKeys.delete(keyCode);
            console.log('Key UP:', data.key, 'code:0x' + keyCode.toString(16));
          }
        }
      }

      // Build HID report with current state
      buffer[2] = this.modifierState;
      const keyArray = Array.from(this.activeKeys).slice(0, 6);
      for (let i = 0; i < keyArray.length; i++) {
        buffer[4 + i] = keyArray[i];
      }

      // Rotate buffer (Python: buffer[-1:] + buffer[:-1], then buffer[0] = 0)
      const rotatedBuffer = [buffer[10], ...buffer.slice(0, 10)];
      rotatedBuffer[0] = 0;

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

  getModifierCode(key, code) {
    // Handle the ShiftRight bug in Keyboard Lock API where event.code is empty
    // This is a known issue where ShiftRight reports event.code as '' but event.key as 'Shift'
    let actualCode = code;
    if (code === '' && key === 'Shift') {
      actualCode = 'ShiftRight';
    }
    
    // Modifier keys for byte 2 of keyboard buffer
    const modifierMap = {
      // Physical keys via code (more reliable)
      'ControlLeft': 1,    // Left Control
      'ShiftLeft': 2,      // Left Shift  
      'AltLeft': 4,        // Left Alt
      'MetaLeft': 8,       // Left GUI (Cmd)
      'ControlRight': 16,  // Right Control
      'ShiftRight': 32,    // Right Shift
      'AltRight': 64,      // Right Alt
      'MetaRight': 128,    // Right GUI (Cmd)
      
      // Fallback via key name (only for left modifiers)
      'Control': 1,        
      'Shift': 2,          
      'Alt': 4,            
      'Meta': 8            
    };
    
    // Try actual code first, then key
    return modifierMap[actualCode] || modifierMap[key] || 0;
  }

  getKeyCode(key, code, usbHid, scanCode, platformCode) {
    // Prefer explicit USB HID usage if provided by rdev.
    if (usbHid && Number.isInteger(usbHid) && usbHid > 0) {
      return usbHid & 0xFF;
    }

    // Fallback: use scan/platform codes if they look like HID usages.
    if (scanCode && Number.isInteger(scanCode) && scanCode > 0) {
      return scanCode & 0xFF;
    }
    if (platformCode && Number.isInteger(platformCode) && platformCode > 0) {
      return platformCode & 0xFF;
    }
    // Use code for more reliable key mapping when available
    const codeMap = {
      'KeyA': 0x04, 'KeyB': 0x05, 'KeyC': 0x06, 'KeyD': 0x07,
      'KeyE': 0x08, 'KeyF': 0x09, 'KeyG': 0x0A, 'KeyH': 0x0B,
      'KeyI': 0x0C, 'KeyJ': 0x0D, 'KeyK': 0x0E, 'KeyL': 0x0F,
      'KeyM': 0x10, 'KeyN': 0x11, 'KeyO': 0x12, 'KeyP': 0x13,
      'KeyQ': 0x14, 'KeyR': 0x15, 'KeyS': 0x16, 'KeyT': 0x17,
      'KeyU': 0x18, 'KeyV': 0x19, 'KeyW': 0x1A, 'KeyX': 0x1B,
      'KeyY': 0x1C, 'KeyZ': 0x1D,
      'Digit1': 0x1E, 'Digit2': 0x1F, 'Digit3': 0x20, 'Digit4': 0x21,
      'Digit5': 0x22, 'Digit6': 0x23, 'Digit7': 0x24, 'Digit8': 0x25,
      'Digit9': 0x26, 'Digit0': 0x27,
      'Space': 0x2C, 'Tab': 0x2B, 'Enter': 0x28, 'Escape': 0x29,
      'Backspace': 0x2A, 'Delete': 0x4C, 'Insert': 0x49,
      'Home': 0x4A, 'End': 0x4D, 'PageUp': 0x4B, 'PageDown': 0x4E,
      'ArrowUp': 0x52, 'ArrowDown': 0x51, 'ArrowLeft': 0x50, 'ArrowRight': 0x4F,
      // Symbol keys - using physical key codes for reliable mapping
      'BracketLeft': 0x2F,    // [ and {
      'BracketRight': 0x30,   // ] and }
      'Backslash': 0x31,      // \ and |
      'Semicolon': 0x33,      // ; and :
      'Quote': 0x34,          // ' and "
      'Comma': 0x36,          // , and <
      'Period': 0x37,         // . and >
      'Slash': 0x38,          // / and ?
      'Minus': 0x2D,          // - and _
      'Equal': 0x2E,          // = and +
      'Backquote': 0x35,      // ` and ~
      // Function keys - ensuring proper mapping for macOS system keys
      'F1': 0x3A, 'F2': 0x3B, 'F3': 0x3C, 'F4': 0x3D,
      'F5': 0x3E, 'F6': 0x3F, 'F7': 0x40, 'F8': 0x41,
      'F9': 0x42, 'F10': 0x43, 'F11': 0x44, 'F12': 0x45,
      // Additional macOS function keys
      'F13': 0x68, 'F14': 0x69, 'F15': 0x6A, 'F16': 0x6B,
      'F17': 0x6C, 'F18': 0x6D, 'F19': 0x6E, 'F20': 0x6F
    };
    
    // Try code first (more reliable for physical keys)
    if (code && codeMap[code]) {
      return codeMap[code];
    }
    
    // Fallback to key mapping
    const keyMap = {
      'Tab': 0x2B, 'CapsLock': 0x39, 'Backspace': 0x2A, 'Enter': 0x28,
      'Insert': 0x49, 'Delete': 0x4C, 'Home': 0x4A, 'End': 0x4D,
      'PageUp': 0x4B, 'PageDown': 0x4E, 'ArrowUp': 0x52, 'ArrowDown': 0x51,
      'ArrowLeft': 0x50, 'ArrowRight': 0x4F, 'Escape': 0x29, ' ': 0x2C,
      '`': 0x35, ';': 0x33, "'": 0x34, '[': 0x2F, ']': 0x30, '\\': 0x31,
      '-': 0x2D, '=': 0x2E, ',': 0x36, '.': 0x37, '/': 0x38,
      // Special keys that rdev may return with different names
      'BackQuote': 0x35, 'Grave': 0x35,  // ` key
      'Dot': 0x37,                        // . key (rdev returns "Dot" not "Period")
      'PrintScreen': 0x46,
      'NumLock': 0x53,
      'ScrollLock': 0x47,
      'Pause': 0x48,
      // Note: On macOS, Pause is often mapped to F15, but we want the actual Pause key (0x48)
      // F15 will map to 0x6A normally, but if user wants Pause behavior, it should be 0x48
      // Keypad keys
      'KpDivide': 0x54, 'KpMultiply': 0x55, 'KpMinus': 0x56, 'KpPlus': 0x57,
      'KpReturn': 0x58, 'Kp1': 0x59, 'Kp2': 0x5A, 'Kp3': 0x5B,
      'Kp4': 0x5C, 'Kp5': 0x5D, 'Kp6': 0x5E, 'Kp7': 0x5F,
      'Kp8': 0x60, 'Kp9': 0x61, 'Kp0': 0x62,
      'KpDecimal': 0x63,  // Numpad period/delete (all variants)
      'KpComma': 0x85  // Numpad comma (some keyboards)
    };

    // Numbers 1-9, 0
    for (let i = 1; i <= 9; i++) {
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

    // Function keys F1-F12
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
