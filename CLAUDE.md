# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Electron-based KVM (Keyboard-Video-Mouse) client for macOS designed to work with hardware KVM switches using USB capture cards (MS2130 or compatible). The application captures video from USB devices and sends keyboard/mouse input to target systems via HID protocol.

**Target Hardware:**
- HID Device: Vendor ID `0x413D`, Product ID `0x2107`, Usage Page `0xFF00`
- Video: USB capture devices (MS2130 or compatible)

## Build & Development Commands

### Running the Application
```bash
npm start              # Run in production mode
npm run dev           # Run in development mode with --dev flag
```

### Building
```bash
npm run build         # Standard build (uses prebuilt native modules)
npm run build:rebuild # Build with native module rebuilding (for Ubuntu 20.04 compatibility)
npm run dist          # Create distribution packages without publishing
npm run dist:rebuild  # Create distribution with native rebuilding
```

### Native Module Build
```bash
npm run build:native  # Build the rdev-grabber Rust native module
```

**Note:** The rdev-grabber native module is required for system-level keyboard capture but optional for basic functionality. If not built, you'll see a warning at startup but the app will still function without global keyboard capture.

### Platform-Specific Build Notes

- **macOS**: Standard build works fine
- **Ubuntu 22.04+**: Standard build works fine
- **Ubuntu 20.04**: Use `build:rebuild` scripts due to GLIBC compatibility issues
- **Windows**: Standard build works fine

Distribution outputs are placed in the `dist/` directory.

## Architecture

### Main Process ([src/main.js](src/main.js))
Electron main process managing:
- Window lifecycle and IPC handlers
- Native module integration (rdev-grabber for keyboard capture)
- Control mode state management (controls when keyboard grab is active)
- macOS permissions checking (Accessibility/Input Monitoring required)

**Key State Variables:**
- `isInControlMode`: Whether the app should capture keyboard input
- `isWindowFocused`: Whether the Electron window has focus
- `rdevRunning`: Whether the rdev grabber is actively capturing

The grabber only runs when BOTH `isInControlMode` AND `isWindowFocused` are true.

### HID Manager ([src/hid-manager.js](src/hid-manager.js))
Handles USB HID communication with the KVM hardware:
- Device discovery and connection using `node-hid`
- Mouse event translation (absolute/relative positioning, button states, wheel)
- Keyboard event translation (USB HID keycodes, modifier tracking)
- Maintains state for currently pressed keys and modifiers

**Protocol Details:**
- Mouse reports: 9-byte buffers with report ID, button state, coordinates (0-32767 range for absolute)
- Keyboard reports: 11-byte buffers with report ID, modifier byte, and up to 6 simultaneous key codes
- Buffer rotation: All reports are rotated before sending (last byte becomes first, first byte set to 0)

**Key Mapping:**
- Prefers explicit USB HID codes from rdev when available
- Falls back to `code` (physical key) then `key` (character) for mapping
- Function keys F1-F20 supported with proper macOS handling

### Native Keyboard Grabber ([native/rdev-grabber/](native/rdev-grabber/))
Rust native module using `rdev` and `napi-rs`:
- Cross-platform low-level keyboard capture (macOS, Windows, Linux)
- Blocks keyboard events from reaching OS when in control mode
- Provides USB HID codes directly for accurate key mapping
- Implements platform-specific handling (e.g., CapsLock, NumLock pass-through)

**Build System:**
- Written in Rust using napi-rs for Node.js bindings
- Outputs to `native/rdev-grabber/index.darwin-arm64.node` (or platform-specific)
- Built via `npm run build:native` which calls `napi build`

### Renderer Process ([src/renderer/](src/renderer/))
Frontend UI handling:
- WebRTC-based video capture from USB devices (no backend server needed)
- Mouse/keyboard event capture from user interaction
- Two mouse modes: absolute (click-to-position) and relative (drag-to-move)
- Virtual keyboard for special key combinations
- Settings persistence via localStorage
- Customizable quit key combination

### Video Server ([src/video-server.js](src/video-server.js))
Legacy stub - video is now handled directly in renderer via WebRTC (`navigator.mediaDevices`).

### Preload ([src/preload.js](src/preload.js))
Context bridge exposing IPC methods to renderer:
- Video device management
- HID device management
- Mouse/keyboard event sending
- Control mode toggling
- Global keyboard event listening

## Common Development Patterns

### Adding New Keyboard Keys
1. Add USB HID code to `key_to_usb_hid()` in [native/rdev-grabber/src/lib.rs](native/rdev-grabber/src/lib.rs)
2. Add code mapping to `codeMap` or `keyMap` in [src/hid-manager.js](src/hid-manager.js) `getKeyCode()`
3. Rebuild native module: `npm run build:native`

### Adding New Mouse Features
Modify `sendMouseEvent()` in [src/hid-manager.js](src/hid-manager.js):
- Mouse reports use buffer index [0]=report_id, [2]=button_state, [3-6]=coordinates, [7]=wheel
- Remember to apply buffer rotation before sending

### Debugging Keyboard Issues
Enable debug logging already in place:
- Main process logs rdev events with `━━━ RDEV EVENT ━━━` markers
- HID manager logs modifier/key states with bit patterns
- Check macOS permissions: System Settings → Privacy & Security → Accessibility

### Testing HID Communication
Use built-in test buttons in UI:
- Test Mouse: Sends relative movement
- Test Keyboard: Sends 'a' key
- Test F3/F11: Tests function keys
- Reset Keys: Clears stuck modifier/key states
- Send Ctrl+Alt+Del: Common system combination

## Platform-Specific Notes

### macOS
- Requires Accessibility permission (Input Monitoring) for keyboard capture
- Permission check happens at startup and when entering control mode
- Function keys may be intercepted by system (Mission Control, Brightness, etc.)
- The app prompts for permission automatically on first keyboard capture attempt

### Linux (Ubuntu/Debian)
- Requires HID device permissions (udev rules)
- See [LINUX_HID_SETUP.md](LINUX_HID_SETUP.md) for setup instructions
- .deb packages include post-install script for automatic setup
- AppImage users need to run post-install script manually

### Windows
- HID device access typically works without additional setup
- May require running as administrator for first connection

## Build System Details

### electron-builder Configuration
Build settings in [package.json](package.json) `build` section:
- Multi-platform: macOS (DMG), Windows (NSIS/Portable), Linux (AppImage/DEB)
- Extra resources: README, udev rules, post-install script
- Entitlements for macOS hardened runtime
- Architecture: x64 and arm64 for all platforms

### Native Dependencies
- `node-hid` (v3.0.0): USB HID device communication
- `rdev-grabber`: Custom Rust native module for keyboard capture

GitHub Actions CI builds use prebuilt binaries for speed; local builds can use `build:rebuild` for system-specific compilation.

## Key Files Reference

- [src/main.js](src/main.js) - Main Electron process, window management, IPC handlers
- [src/hid-manager.js](src/hid-manager.js) - HID protocol implementation, key/mouse mapping
- [src/renderer/app.js](src/renderer/app.js) - Frontend application logic
- [native/rdev-grabber/src/lib.rs](native/rdev-grabber/src/lib.rs) - Native keyboard grabber
- [BUILD.md](BUILD.md) - Detailed build instructions for all platforms
- [LINUX_HID_SETUP.md](LINUX_HID_SETUP.md) - Linux permissions setup guide

## Troubleshooting

### "rdev-grabber native module not loaded"
This warning is expected if you haven't built the native module. Run `npm run build:native` to enable global keyboard capture. The app works without it but won't capture system hotkeys.

### HID Connection Fails on macOS
Check Input Monitoring permission: System Settings → Privacy & Security → Accessibility. Add your terminal or Electron app.

### GLIBC Errors on Ubuntu 20.04
Use rebuild scripts: `npm run build:rebuild` instead of `npm run build`.

### Keyboard Keys Not Working
1. Check if USB HID code is defined in Rust native module
2. Verify key mapping in hid-manager.js
3. Check console for "Unknown key" warnings
4. Use test buttons to verify HID communication

### Mouse Not Responding
1. Ensure HID device is connected (check HID status indicator)
2. Try absolute mode if relative mode isn't working
3. Check mouse coordinates are in valid range (0-32767 for absolute)
