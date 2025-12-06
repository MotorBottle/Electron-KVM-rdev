# CI/CD Plan: Multi-Platform Automated Builds & Releases

## Overview

Automate building and releasing KVM Client for **Windows**, **macOS**, and **Linux** on every commit/tag push using GitHub Actions.

## Goals

1. ✅ **Automated Builds**: Build on push to main branch or version tags
2. ✅ **Multi-Platform**: Windows (x64, arm64), macOS (x64, arm64), Linux (x64, arm64)
3. ✅ **Automatic Releases**: Create GitHub releases with downloadable artifacts
4. ✅ **Linux Post-Install**: Integrate post-install.sh script with .deb installer
5. ✅ **Code Signing**: Optional (Windows/macOS) for trusted downloads
6. ✅ **Caching**: Speed up builds with npm/cargo caching

## Architecture

```
GitHub Push (main/tags)
    ↓
GitHub Actions Workflow Triggers
    ↓
┌─────────────┬──────────────┬─────────────┐
│   Windows   │    macOS     │    Linux    │
│  (x64+arm)  │  (x64+arm)   │  (x64+arm)  │
└──────┬──────┴──────┬───────┴──────┬──────┘
       │             │              │
    Build .exe   Build .dmg    Build .deb
    Build .zip   Build .zip    Build .AppImage
       │             │              │
       └─────────────┴──────────────┘
                     ↓
           Upload to GitHub Release
                     ↓
         Users Download Installers
```

## Workflow Strategy

### Trigger Conditions

1. **On Push to `main`**: Build all platforms, create draft release with version from package.json
2. **On Tag Push `v*`**: Build all platforms, create public release with changelog
3. **Manual Trigger**: Allow manual workflow dispatch for testing

### Build Matrix

| Platform | Runner | Architectures | Outputs |
|----------|--------|---------------|---------|
| Windows | `windows-latest` | x64, arm64 | `.exe` (NSIS installer), `.exe` (portable) |
| macOS | `macos-latest` | x64 (Intel), arm64 (Apple Silicon) | `.dmg` (installer), universal binary |
| Linux | `ubuntu-22.04` | x64, arm64 | `.deb` (with post-install), `.AppImage` |

## Workflow Steps (Per Platform)

### 1. Setup Environment
```yaml
- Checkout code
- Setup Node.js 18
- Setup Rust (for native rdev-grabber)
- Install system dependencies (platform-specific)
- Cache npm modules
- Cache Cargo registry
```

### 2. Install Dependencies
```yaml
- npm install (root)
- npm run build:native (Rust native module)
```

### 3. Build Application
```yaml
- electron-builder --publish=never
  - Builds for target platform
  - Includes post-install.sh for Linux .deb
  - Signs binaries (if certificates provided)
```

### 4. Upload Artifacts
```yaml
- Upload dist/* to workflow artifacts
- Store for release creation
```

### 5. Create Release (Release Job)
```yaml
- Wait for all build jobs to complete
- Download all artifacts
- Create/update GitHub release
- Upload all installers as release assets
```

## Linux-Specific: Post-Install Script Integration

### Current Setup (Already Configured!)

**package.json** (lines 119-124):
```json
"deb": {
  "depends": ["libusb-1.0-0", "libudev1", "libc6"],
  "afterInstall": "assets/post-install.sh",
  "maintainer": "MotorBottle <motorbottt@gmail.com>",
  "synopsis": "KVM Client for USB HID devices"
}
```

**How it Works**:
1. electron-builder packages `assets/post-install.sh` into the .deb
2. When user installs: `sudo apt install ./KVM-Client-1.0.0.deb`
3. Debian automatically runs `post-install.sh` as root after extracting files
4. Script:
   - Copies udev rules to `/etc/udev/rules.d/`
   - Adds user to `plugdev` group
   - Reloads udev rules
   - Sets permissions on `/dev/hidraw*` devices

**User Experience**:
```bash
# User runs
sudo apt install ./KVM-Client-1.0.0.deb

# Output shows
Setting up HID device permissions...
Installing udev rules (requires sudo)...
Adding user to plugdev group...
IMPORTANT: Please log out and log back in for group membership changes to take effect.
```

### Additional Integration Points

**AppImage**: Post-install script bundled in `extraResources`, user must run manually:
```bash
./KVM-Client-1.0.0.AppImage --appimage-extract
cd squashfs-root/resources
sudo ./post-install.sh
```

**Auto-run on First Launch** (Optional Enhancement):
- Detect if udev rules missing
- Show dialog: "Would you like to configure HID permissions? (requires sudo)"
- Run post-install.sh via `electron.shell.openExternal('pkexec ...')`

## Release Naming Convention

### Version Tags
```
v1.0.0     → Stable release
v1.0.0-rc1 → Release candidate
v1.0.0-beta → Beta release
```

### Artifact Naming
```
Windows:
  KVM-Client-1.0.0-win-x64.exe
  KVM-Client-1.0.0-win-arm64.exe
  KVM-Client-1.0.0-win-x64-portable.exe
  KVM-Client-1.0.0-win-arm64-portable.exe

macOS:
  KVM-Client-1.0.0-mac-universal.dmg
  KVM-Client-1.0.0-mac-x64.dmg
  KVM-Client-1.0.0-mac-arm64.dmg

Linux:
  KVM-Client-1.0.0-linux-x64.deb
  KVM-Client-1.0.0-linux-arm64.deb
  KVM-Client-1.0.0-linux-x64.AppImage
  KVM-Client-1.0.0-linux-arm64.AppImage
```

## GitHub Secrets (Optional)

For code signing and notarization:

### Windows
```
WINDOWS_CERTIFICATE: Base64-encoded .pfx certificate
WINDOWS_CERTIFICATE_PASSWORD: Certificate password
```

### macOS
```
APPLE_ID: Apple Developer ID email
APPLE_ID_PASSWORD: App-specific password
APPLE_TEAM_ID: Team ID for notarization
CSC_LINK: Base64-encoded .p12 certificate
CSC_KEY_PASSWORD: Certificate password
```

### GitHub
```
GITHUB_TOKEN: Automatically provided by GitHub Actions
```

## Workflow Files Structure

```
.github/
  workflows/
    build.yml          # Main build workflow
    release.yml        # Release creation workflow
    test.yml           # (Optional) Test workflow
```

## Build Performance Optimizations

1. **Caching Strategy**:
   ```yaml
   - NPM cache (~/.npm)
   - Cargo cache (~/.cargo/registry)
   - electron-builder cache (~/.cache/electron-builder)
   ```

2. **Parallel Builds**: All 3 platforms build simultaneously (reduces total time by ~66%)

3. **Incremental Builds**: Only rebuild native module if Rust code changed

4. **Matrix Optimization**: Use `fail-fast: false` to continue other builds if one fails

## Expected Build Times

| Platform | Cold Build | Cached Build |
|----------|-----------|--------------|
| Windows | ~8 min | ~3 min |
| macOS | ~10 min | ~4 min |
| Linux | ~6 min | ~2 min |
| **Total** | **~10 min** | **~4 min** |

(Platforms build in parallel)

## Release Process

### Automatic (Recommended)

1. **Update Version**:
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   # or
   npm version minor  # 1.0.0 -> 1.1.0
   # or
   npm version major  # 1.0.0 -> 2.0.0
   ```

2. **Push Tag**:
   ```bash
   git push origin main --tags
   ```

3. **Wait for Build**: GitHub Actions builds all platforms (~10 min)

4. **Release Created**: GitHub automatically creates release with:
   - Auto-generated changelog
   - All platform installers
   - Source code archives

### Manual

1. **Go to GitHub Actions** tab
2. **Select Build Workflow**
3. **Click "Run workflow"**
4. **Enter version tag** (e.g., v1.0.1)
5. **Click "Run workflow"**

## Post-Release Checklist

- [ ] Test installers on each platform
- [ ] Verify Linux post-install script works
- [ ] Check HID permissions on Linux
- [ ] Test keyboard grabbing on all platforms
- [ ] Update documentation if needed
- [ ] Announce release (Discord, Twitter, etc.)

## Troubleshooting

### Build Fails on Linux
- Check Rust toolchain installation
- Verify libX11-devel and related packages
- Check `npm run build:native` works locally

### Post-Install Script Doesn't Run
- Verify `afterInstall` in package.json
- Check script has execute permissions
- Test manually: `sudo ./post-install.sh`

### macOS Signing Fails
- Ensure certificates are valid
- Check Apple ID credentials
- Verify notarization entitlements

### Windows Portable Not Created
- Check electron-builder config
- Verify `portable` target in package.json
- Check dist/ folder for output

## Future Enhancements

1. **Auto-Update**: Implement electron-updater for in-app updates
2. **Beta Channel**: Separate workflow for beta releases
3. **Checksums**: Generate SHA256 checksums for downloads
4. **Docker Builds**: Use Docker for reproducible Linux builds
5. **Snap/Flatpak**: Additional Linux packaging formats
6. **Chocolatey**: Windows package manager integration
7. **Homebrew**: macOS package manager integration

## Implementation Files

Next step: Create the actual workflow files based on this plan.

Files to create:
1. `.github/workflows/build.yml` - Main build workflow
2. `.github/workflows/release.yml` - Release creation workflow
3. `RELEASE.md` - Release process documentation
