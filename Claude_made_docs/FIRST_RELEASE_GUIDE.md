# First Release Guide: v0.1.0-beta

## What's Been Set Up

✅ **GitHub Actions Workflow**: `.github/workflows/release.yml`
✅ **Version Set**: `0.1.0-beta` in `package.json`
✅ **Trigger**: Build ONLY when you push tags (saves Actions minutes)
✅ **Platforms**: Windows (x64, arm64), macOS (x64, arm64), Linux (x64, arm64)
✅ **Linux Post-Install**: Automatically runs on .deb installation

## How to Create Your First Release

### Step 1: Commit All Changes

First, commit the workflow file and updated version:

```bash
cd /Volumes/KIOXIA/VSCodeProj/rustdesk/osrbot_client/electron-kvm

git add .github/workflows/release.yml
git add package.json
git commit -m "Add GitHub Actions workflow and set version to 0.1.0-beta"
git push origin main
```

**Note**: This push does NOT trigger a build (no tag pushed yet).

### Step 2: Create the v0.1.0-beta Tag

```bash
# Create the tag
git tag v0.1.0-beta

# Push the tag to GitHub (this WILL trigger the build)
git push origin v0.1.0-beta
```

**Alternative**: Use npm to create the tag (but version is already set):
```bash
# Since version is already 0.1.0-beta, just create tag manually
git tag v0.1.0-beta -m "First beta release"
git push origin v0.1.0-beta
```

### Step 3: Monitor the Build

1. Go to GitHub Actions:
   ```
   https://github.com/MotorBottle/USB-KVM-Electron/actions
   ```

2. You'll see the workflow "Build and Release" running with 4 jobs:
   - `build-windows` (takes ~8 min)
   - `build-macos` (takes ~10 min)
   - `build-linux` (takes ~6 min)
   - `create-release` (waits for all 3 to finish)

3. Watch the progress:
   ```
   ┌─────────────────────────────────────┐
   │ build-windows   [████░░] 60%        │
   │ build-macos     [██░░░░] 40%        │
   │ build-linux     [██████] 100% ✅    │
   │ create-release  [......] Waiting    │
   └─────────────────────────────────────┘
   ```

### Step 4: Release Created!

After ~10 minutes, all jobs complete and the release is automatically created:

```
https://github.com/MotorBottle/USB-KVM-Electron/releases/tag/v0.1.0-beta
```

The release will have:
- **Tag**: v0.1.0-beta
- **Title**: Release v0.1.0-beta
- **Pre-release badge**: ⚠️ (because it contains "-beta")
- **Downloads**: All installer files (~9-12 files)

## Expected Build Outputs

### Windows (4 files)
- `KVM-Client-0.1.0-beta-win-x64.exe` (NSIS installer)
- `KVM-Client-0.1.0-beta-win-arm64.exe` (NSIS installer)
- `KVM-Client-0.1.0-beta-win-x64-portable.exe`
- `KVM-Client-0.1.0-beta-win-arm64-portable.exe`

### macOS (2-3 files)
- `KVM-Client-0.1.0-beta-mac-universal.dmg` (Intel + Apple Silicon)
- `KVM-Client-0.1.0-beta-mac-x64.dmg` (Intel only)
- `KVM-Client-0.1.0-beta-mac-arm64.dmg` (Apple Silicon only)

### Linux (4 files)
- `KVM-Client-0.1.0-beta-linux-x64.deb` ← **Auto post-install**
- `KVM-Client-0.1.0-beta-linux-arm64.deb`
- `KVM-Client-0.1.0-beta-linux-x64.AppImage`
- `KVM-Client-0.1.0-beta-linux-arm64.AppImage`

## Troubleshooting

### If Build Fails

Click on the failed job to see the error:

**Common Issues**:

1. **Windows build fails**:
   - Rust toolchain issue
   - Solution: Check `build:native` script works locally

2. **macOS build fails**:
   - Missing entitlements file
   - Solution: Ensure `assets/entitlements.mac.plist` exists

3. **Linux build fails**:
   - Missing system dependencies
   - Solution: Check all X11 libraries listed in workflow

4. **Native module build fails**:
   - Cargo.lock conflict
   - Solution: Update Rust dependencies

### Viewing Build Logs

```
GitHub Actions → Click workflow run → Click job name → Expand step
```

### Retry Failed Build

If build fails, fix the issue and create a new tag:

```bash
# Fix the issue
git add .
git commit -m "Fix build issue"

# Delete old tag
git tag -d v0.1.0-beta
git push origin :refs/tags/v0.1.0-beta

# Recreate tag
git tag v0.1.0-beta
git push origin v0.1.0-beta
```

Or create next beta version:

```bash
# Update version to 0.1.0-beta.1
npm version prerelease
git push origin main --tags
```

## Next Releases

### Next Beta (0.1.0-beta.1)

```bash
npm version prerelease
# 0.1.0-beta → 0.1.0-beta.0 (npm adds .0)
# Then manually fix to 0.1.0-beta.1 in package.json

git add package.json
git commit -m "Bump version to 0.1.0-beta.1"
git tag v0.1.0-beta.1
git push origin main --tags
```

### Stable Release (0.1.0)

When ready to go stable:

```bash
# Set version to 0.1.0 (remove -beta)
npm version 0.1.0 --no-git-tag-version
git add package.json
git commit -m "Release v0.1.0 stable"
git tag v0.1.0
git push origin main --tags
```

### Bug Fix Release (0.1.1)

```bash
npm version patch
git push origin main --tags
# 0.1.0 → 0.1.1
```

### Next Feature Release (0.2.0)

```bash
npm version minor
git push origin main --tags
# 0.1.1 → 0.2.0
```

## Testing the Release

### Download and Test

1. Go to the release page
2. Download installer for your platform
3. Install and test:
   - Windows: Run .exe installer or portable
   - macOS: Open .dmg and drag to Applications
   - Linux: `sudo apt install ./KVM-Client-0.1.0-beta-linux-x64.deb`

### Verify Linux Post-Install

```bash
# After installing .deb
sudo apt install ./KVM-Client-0.1.0-beta-linux-x64.deb

# Check output shows:
# Setting up HID device permissions...
# Installing udev rules (requires sudo)...
# Adding user to plugdev group...

# Verify udev rules installed
ls -la /etc/udev/rules.d/99-hidraw-permissions.rules

# Verify group membership
groups | grep plugdev

# Log out and back in for group to take effect
```

## Release Checklist

Before pushing the tag:

- [ ] All changes committed
- [ ] Version updated in package.json
- [ ] Tested build locally: `npm run dist`
- [ ] Native module builds: `npm run build:native`
- [ ] Linux fixes documented in commit messages
- [ ] Ready to publish beta to users

After release created:

- [ ] Download and test all installers
- [ ] Verify Linux post-install script works
- [ ] Test keyboard grabbing on all platforms
- [ ] Update README with download links
- [ ] Announce release (Discord, Twitter, etc.)

## GitHub Actions Limits

**Free for public repos**: ✅ Unlimited minutes
**Your repo**: Public, so no cost concerns

Each full build uses:
- ~24 minutes total (all platforms combined)
- macOS counts as 10x (100 minutes equivalent)
- Total equivalent: ~114 minutes per release

## Future Enhancements

After first release works, consider:

1. **Auto-update**: Add electron-updater for in-app updates
2. **Checksums**: Generate SHA256 for security
3. **Code signing**: Sign Windows/macOS binaries (requires certificates)
4. **Notarization**: Notarize macOS app (requires Apple Developer account)
5. **Draft releases**: Test before publishing to public

## Summary Commands

```bash
# First beta release (run these now)
git add .github/workflows/release.yml package.json
git commit -m "Add GitHub Actions workflow and set version to 0.1.0-beta"
git push origin main

git tag v0.1.0-beta
git push origin v0.1.0-beta

# Wait ~10 minutes, then check:
# https://github.com/MotorBottle/USB-KVM-Electron/releases
```

## Questions?

If you encounter issues:
1. Check GitHub Actions logs
2. Test build locally: `npm run dist`
3. Verify all dependencies installed
4. Check workflow file syntax

Ready to push your first release? 🚀
