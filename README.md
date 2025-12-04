# Electron KVM Client

A cross-platform KVM (Keyboard-Video-Mouse) client built with Electron for macOS, designed to work with hardware KVM switches using 单片机 + MS2130 capture cards.

## Features

- **Video Streaming**: Capture and display video from USB capture devices via WebRTC
- **Mouse & Keyboard Control**: Send mouse and keyboard events to the target system via HID
- **System-Level Keyboard Capture**: Native Rust module for capturing all keyboard input (including system hotkeys)
- **Cross-platform**: Supports macOS, Windows, and Linux
- **Two Mouse Modes**: Absolute positioning (click-to-position) and relative movement (drag-to-move)
- **Customizable Quit Key**: Configure your own key combination to exit control mode
- **Virtual Keyboard**: On-screen keyboard for special key combinations
- **Modern UI**: Clean, dark-themed interface with fullscreen support

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
   - Click on the video stream to enter control mode (captures mouse/keyboard input)
   - Press **Ctrl+Alt** (default) to exit control mode
   - Customize quit key in settings
   - Use test buttons to verify functionality

4. **Mouse Control Modes**:
   - **Absolute Mode** (default): Click anywhere on the video to send absolute mouse positions
   - **Relative Mode**: Move mouse for relative positioning (like a traditional remote desktop)
   - Toggle between modes using the switch in the control panel

5. **macOS Permissions**:
   - On first run, macOS will prompt for Accessibility and Input Monitoring permissions
   - Grant these permissions to enable system-level keyboard capture
   - Without permissions, basic keyboard input still works but system hotkeys won't be captured

## Development

### Running the Application
- **Start**: `npm start` - Run in production mode
- **Development mode**: `npm run dev` - Run with development flags

### Building
- **Build**: `npm run build` - Standard build (uses prebuilt native modules)
- **Build with rebuild**: `npm run build:rebuild` - Build with native module rebuilding (for Ubuntu 20.04)
- **Native module only**: `npm run build:native` - Rebuild the Rust native keyboard capture module

### Packaging
- **Package**: `npm run dist` - Create distribution packages for current platform
- **Package with rebuild**: `npm run dist:rebuild` - Create distribution with native rebuilding

### Distribution Output
Built packages are placed in the `dist/` directory:
- **macOS**: `.dmg` installer
- **Windows**: `.exe` installer and portable version
- **Linux**: `.AppImage` and `.deb` packages

## Hardware Requirements

- USB video capture device (MS2130 or compatible)
- HID-compatible KVM hardware with:
  - Vendor ID: 0x413D
  - Product ID: 0x2107
  - Usage Page: 0xFF00

## Technical Details

The application consists of:

- **Main Process** (`src/main.js`): Electron main process handling window management, IPC, and native keyboard integration
- **HID Manager** (`src/hid-manager.js`): Handles USB HID communication with KVM hardware, translates keyboard/mouse events to HID protocol
- **Native Keyboard Grabber** (`native/rdev-grabber/`): Rust native module using rdev for system-level keyboard capture
- **Renderer** (`src/renderer/`): Frontend UI built with HTML/CSS/JavaScript, uses WebRTC for video capture
- **Video Server** (`src/video-server.js`): Legacy stub - video now handled directly in renderer

### Architecture Highlights
- **Keyboard Capture**: Uses Rust + rdev for low-level keyboard hooks, blocking events from OS when in control mode
- **HID Protocol**: Implements USB HID keyboard/mouse protocol with proper modifier tracking and buffer rotation
- **Video**: Direct WebRTC access to USB capture devices via `navigator.mediaDevices`
- **Cross-Platform**: Platform-specific handling for macOS (Accessibility permissions), Windows, and Linux (udev rules)

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

### Video Issues
- **No video devices**: Ensure USB capture device is connected and recognized by your OS
- **Black screen**: Try selecting a different video device or reconnecting the capture card
- **Poor quality**: Adjust video quality settings in the sidebar

### HID Connection
- **HID connection fails**: Check that the KVM hardware is connected and has the correct vendor/product IDs (0x413D:0x2107)
- **Mouse/keyboard not working**: Verify HID device is connected and try the test buttons
- **Keys stuck**: Use the "Reset Keys" button to clear any stuck modifier keys

### Keyboard Capture
- **Native module not loaded warning**: This is expected if you haven't built the native module. Run `npm run build:native` to enable global keyboard capture
- **macOS permissions denied**: Grant Accessibility and Input Monitoring permissions in System Settings → Privacy & Security
- **Linux permissions**: On Linux, you need to set up udev rules. See [LINUX_HID_SETUP.md](LINUX_HID_SETUP.md)

### Quit Key Issues
- **Ctrl+Alt not working after re-entering control mode**: This is a known macOS rdev bug that's been fixed with phantom key detection
- **Can't exit control mode**: The app will automatically exit when you close the window
- **Want different quit key**: Configure a custom key combination in the settings panel

### Platform-Specific
- **Ubuntu 20.04 GLIBC errors**: Use the rebuild scripts: `npm run build:rebuild` or `npm run dist:rebuild`
- **macOS app doesn't quit after closing window**: Fixed in latest version - app now properly quits on window close
- **Function keys captured by system**: Some F-keys (F1-F12) may be intercepted by macOS for Mission Control, brightness, etc.

## License

Open source project - see original repository for license details.