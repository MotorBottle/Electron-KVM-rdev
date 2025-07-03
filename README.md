# Electron KVM Client

A cross-platform KVM (Keyboard-Video-Mouse) client built with Electron for macOS, designed to work with hardware KVM switches using 单片机 + MS2130 capture cards.

## Features

- **Video Streaming**: Capture and display video from USB capture devices
- **Mouse & Keyboard Control**: Send mouse and keyboard events to the target system via HID
- **Cross-platform**: Built with Electron for macOS compatibility
- **Modern UI**: Clean, dark-themed interface

## Installation

1. Clone or extract the project
2. Install dependencies:
   ```bash
   cd electron-kvm
   npm install
   ```

## Usage

1. **Start the application**:
   ```bash
   npm start
   ```

2. **Connect devices**:
   - Select your video capture device from the dropdown
   - Click "Start Video" to begin video streaming
   - Select your HID device (the KVM hardware)
   - Click "Connect HID" to enable mouse/keyboard control

3. **Control the remote system**:
   - Click on the video stream to capture mouse/keyboard input
   - Press ESC to release mouse/keyboard capture
   - Use test buttons to verify functionality

4. **Mouse Control Modes**:
   - **Absolute Mode** (default): Click anywhere on the video to send absolute mouse positions
   - **Relative Mode**: Move mouse for relative positioning (like a traditional remote desktop)
   - Toggle between modes using the switch in the control panel

## Development

- **Development mode**: `npm run dev`
- **Build**: `npm run build`
- **Package**: `npm run dist`

## Hardware Requirements

- USB video capture device (MS2130 or compatible)
- HID-compatible KVM hardware with:
  - Vendor ID: 0x413D
  - Product ID: 0x2107
  - Usage Page: 0xFF00

## Technical Details

The application consists of:

- **Main Process** (`src/main.js`): Electron main process handling window management and IPC
- **HID Manager** (`src/hid-manager.js`): Handles communication with KVM hardware
- **Video Server** (`src/video-server.js`): Manages video capture and streaming
- **Renderer** (`src/renderer/`): Frontend UI built with HTML/CSS/JavaScript

## Protocol

### Mouse Events
- **Relative Mode**: Sends movement deltas (deltaX, deltaY) 
- **Absolute Mode**: Sends absolute coordinates (0-65535 range)
- Buttons: Left(0), Middle(1), Right(2), Back(3), Forward(4)
- Wheel: Scroll events

### Keyboard Events
- Standard USB HID keycodes
- Supports all common keys and modifiers
- Function keys F1-F12

## Troubleshooting

1. **No video devices**: Ensure USB capture device is connected and recognized by macOS
2. **HID connection fails**: Check that the KVM hardware is connected and has the correct vendor/product IDs
3. **Mouse/keyboard not working**: Verify HID device is connected and try the test buttons

## License

Open source project - see original repository for license details.