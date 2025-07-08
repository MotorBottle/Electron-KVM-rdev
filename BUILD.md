# Building KVM Client

This guide covers building the KVM Client locally for different platforms and scenarios.

## Quick Start

### For Ubuntu 22.04+ (using prebuilt binaries)
```bash
git clone https://github.com/MotorBottle/USB-KVM-Electron.git
cd USB-KVM-Electron/electron-kvm
npm install
npm run build
```

### For Ubuntu 20.04 (rebuild native modules)
```bash
git clone https://github.com/MotorBottle/USB-KVM-Electron.git
cd USB-KVM-Electron/electron-kvm

# Install system dependencies
sudo apt-get update
sudo apt-get install -y libusb-1.0-0-dev libudev-dev build-essential python3-dev

# Install and build with native module rebuilding
npm install
npm run build:rebuild
```

## Available Build Scripts

- `npm run build` - Standard build (uses prebuilt binaries)
- `npm run build:rebuild` - Build with native module rebuilding (for compatibility)
- `npm run dist` - Create distribution packages
- `npm run dist:rebuild` - Create distribution packages with rebuilding
- `npm start` - Run in development mode
- `npm run dev` - Run in development mode with dev flag

## Platform-Specific Instructions

### Ubuntu 20.04
**Issue**: Older GLIBC may cause compatibility issues with prebuilt `node-hid` binaries.
**Solution**: Use rebuild scripts to compile native modules against your system.

```bash
# Prerequisites
sudo apt-get install libusb-1.0-0-dev libudev-dev build-essential python3-dev

# Build with rebuilding
npm run build:rebuild
```

### Ubuntu 22.04+
Standard build works fine:
```bash
npm run build
```

### Windows
Standard build works fine:
```bash
npm run build
```

### macOS
Standard build works fine:
```bash
npm run build
```

## CI vs Local Builds

### GitHub Actions (CI)
- Uses `ubuntu-latest` (22.04)
- Uses prebuilt binaries for speed
- Sets `ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true`
- Creates builds compatible with Ubuntu 22.04+

### Local Builds
- Can use either standard or rebuild scripts
- Rebuild scripts compile native modules for your specific system
- Better compatibility with older systems

## Output Files

After building, find your packages in the `dist/` directory:

- **Linux**: `*.AppImage`, `*.deb`
- **Windows**: `*.exe`, `win-unpacked/`
- **macOS**: `*.dmg`, `mac/`

## Troubleshooting

### GLIBC Version Errors
If you see errors like `GLIBC_2.33 not found`:
1. Use `npm run build:rebuild` instead of `npm run build`
2. Ensure you have build tools installed

### Permission Errors (Linux)
After building, you may need to set up HID permissions. See `LINUX_HID_SETUP.md` for details.

### Build Failures
1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Try rebuild: `npm run build:rebuild`