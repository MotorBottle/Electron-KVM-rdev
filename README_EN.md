# USB KVM Client

[中文](README.md) | English

## What is this?

USB KVM Client is a cross-platform software KVM (Keyboard-Video-Mouse) client built with Electron. It enables you to control a remote computer through a USB hardware KVM device (based on CH582F(or similar MCU) + MS2130 capture card).

This project is an alternative host client for:
- [osrbot/osrbot_client](https://github.com/osrbot/osrbot_client)

Original Project:
- [Jackadminx/KVM-Card-Mini](https://github.com/Jackadminx/KVM-Card-Mini)

![alt text](image.png)

![alt text](image-1.png)

![alt text](image-2.png)

**Key Differences:**
- **Cross-platform**: Supports macOS (x64/ARM64), Windows (x64/ARM64), and Linux (x64/ARM64)
- **Modern Architecture**: Built with Electron + Rust native modules instead of Python/PySide
- **Enhanced Keyboard Capture**: Uses platform-specific low-level keyboard hooks (inspired by RustDesk) instead of simple keyboard lock
- **Better Performance**: Direct WebRTC video capture, optimized HID protocol implementation

## How It Works

1. **Video Capture**: Captures video from USB video capture device (MS2130 or compatible) using WebRTC API
2. **HID Communication**: Sends keyboard/mouse events to the remote computer via USB HID protocol through your CH582F-based KVM hardware
3. **Keyboard Capture**: Uses native Rust module with rdev library for system-level keyboard capture (blocks OS shortcuts when in control mode)
4. **Two Mouse Modes**:
   - **Absolute Mode**: Click-to-position (direct coordinate mapping)
   - **Relative Mode**: Traditional mouse movement (delta positioning)

## How to Use

Please check the [Release Notes](../../releases) for:
- Platform-specific installation instructions
- First-time setup guide
- Permissions requirements (macOS Accessibility, Linux udev rules)
- Troubleshooting common issues

### Quick Start

**Linux (Ubuntu 22.04+):**
```bash
# Install fuse2 dependency
sudo apt install libfuse2

# Make AppImage executable and run
chmod +x KVM-Client-*.AppImage
./KVM-Client-*.AppImage
```

**Linux (Ubuntu < 22.04):**
```bash
# Install fuse2 dependency
sudo apt-get install fuse libfuse2

# Make AppImage executable and run
chmod +x KVM-Client-*.AppImage
./KVM-Client-*.AppImage
```

**Note:** If the AppImage fails to launch due to version number in filename, rename it to something simpler (e.g., `KVM.AppImage`)

**macOS:**
- Mount the DMG and drag to Applications
- Grant Accessibility and Input Monitoring permissions when prompted

**Windows:**
- Run the installer or use the portable version
- No special permissions required

## Architecture & Technical Details

### Core Components

1. **Main Process** (`src/main.js`)
   - Electron main process
   - Window management and IPC communication
   - Native keyboard module integration
   - System tray and global shortcuts

2. **HID Manager** (`src/hid-manager.js`)
   - USB HID device communication
   - Keyboard/mouse event translation to HID protocol
   - Modifier key tracking and buffer rotation
   - Auto-reconnection on device disconnect

3. **Native Keyboard Grabber** (`native/rdev-grabber/`)
   - Rust native N-API module
   - Platform-specific keyboard hooks:
     - **Windows**: Low-level keyboard hook (WH_KEYBOARD_LL) with message pump
     - **macOS**: CGEvent tap with Accessibility API
     - **Linux**: evdev-based grabbing via rdev
   - Blocks system shortcuts when in control mode
   - Handles phantom key detection (macOS rdev bug fix)

4. **Renderer Process** (`src/renderer/`)
   - WebRTC-based video capture
   - UI controls and settings
   - Mouse event handling (absolute/relative modes)

### Advancements Over Similar Projects

**1. Better Keyboard Capture**
- Uses low-level OS hooks instead of simple keyboard lock
- Properly blocks Windows key, system hotkeys (Alt+Tab, etc.)
- Inspired by RustDesk's approach - thanks to the RustDesk project for the excellent reference implementation

**2. Cross-Platform Support**
- Single codebase for macOS, Windows, and Linux
- Native module with platform-specific optimizations
- Proper ARM64 support for Apple Silicon and Windows ARM

**3. Modern Tech Stack**
- Electron for UI (instead of PySide/Qt)
- Rust for performance-critical native code
- WebRTC for low-latency video streaming
- N-API for stable native module ABI

**4. Enhanced HID Protocol**
- Proper modifier key state tracking
- Buffer rotation to prevent key stuck issues
- Support for all standard keys and function keys
- Mouse wheel and multi-button support

### Hardware Compatibility

This client supports multiple compatible KVM devices through USB HID interface.

**Currently Supported Devices:**
- OSRBOT KVM devices
- KVM Card Mini (CH582F-based)
- Other compatible KVM hardware (VID: 0x413D, PID: 0x2107)

**Adding New Compatible Devices:**

If you have your own KVM hardware with different VID/PID, you can easily add support:

1. Edit `src/renderer/app.js` and add your device to the `COMPATIBLE_DEVICES` array:

```javascript
this.COMPATIBLE_DEVICES = [
    {
        vendorId: 0x413D,
        productId: 0x2107,
        description: 'KVM Control Interface (OSRBOT, KVM Card Mini, etc.)'
    },
    // Add your device:
    {
        vendorId: 0x1234,  // Your device's Vendor ID
        productId: 0x5678,  // Your device's Product ID
        description: 'My Custom KVM Device'
    }
];
```

2. Restart the app and your device will be automatically detected and connected

**For details:** See [Compatible Devices Documentation](COMPATIBLE_DEVICES.md) for:
- How to find your device's VID/PID
- Step-by-step instructions for adding new devices
- Protocol requirements and troubleshooting

## CH582F Firmware Update (rough steps)

- Source: `HID_CompliantDev/src/Main.c` (`USB_SWAP_MODE` lets you swap the two USB port roles; when set to 1, USB2 is the controller/host-side link and USB1 is the keyboard/mouse to the target PC).
- Build: Open `HID_CompliantDev/HID_CompliantDev.wvproj` in MounRiver Studio, build, and grab the generated `Objects/HID_CompliantDev.bin` (or hex).
- Flash: Use WCHISPTool or WCH-LinkUtility, put the CH582F into boot mode (hold BOOT while powering/resetting), select the generated firmware, flash, then power-cycle.
- Backup first: If a working firmware is on the board, read it out and keep a copy before overwriting.

## Building from Source

```bash
# Install dependencies
npm install

# Build native module
npm run build:native

# Run in development
npm run dev

# Create distribution packages
npm run dist
```

For Ubuntu 20.04 or systems with older GLIBC, use rebuild variants:
```bash
npm run build:rebuild
npm run dist:rebuild
```

## Acknowledgments

Special thanks to:
- **[RustDesk](https://github.com/rustdesk/rustdesk)**: For the excellent reference implementation of cross-platform keyboard capture, which greatly improved this project's keyboard handling
- **[rdev](https://github.com/Narsil/rdev)**: For the low-level keyboard/mouse event library

## License

MIT License - see LICENSE file for details
