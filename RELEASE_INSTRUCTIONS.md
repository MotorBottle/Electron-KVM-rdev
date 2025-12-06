# Release Instructions: v0.1.0

## ✅ Ready to Release

- **Version**: 0.1.0 (stable, no beta)
- **Method**: Using `npm version` (recommended)
- **Workflow**: `.github/workflows/release.yml` configured

## 🚀 Create v0.1.0 Release (2 Steps)

### Step 1: Commit All Changes

```bash
cd /Volumes/KIOXIA/VSCodeProj/rustdesk/osrbot_client/electron-kvm

# Add all files (workflow, docs, version change)
git add .

# Commit everything
git commit -m "Setup CI/CD workflow and prepare for v0.1.0 release

- Add GitHub Actions workflow for multi-platform builds
- Configure automatic Linux post-install script
- Update documentation for release process
- Set version to 0.1.0"

# Push to main
git push origin main
```

**Note**: This does NOT trigger a build yet (no tag pushed).

### Step 2: Create Tag with npm version

```bash
# This creates the tag and triggers the build
npm version 0.1.0 --force

# Push the tag to GitHub (triggers build!)
git push origin --tags
```

**Why `--force`?** Because version is already 0.1.0 in package.json, npm version will complain. `--force` creates the tag anyway.

**Alternative** (if you want npm to handle everything):
```bash
# Temporarily change version back
npm version 0.0.1 --no-git-tag-version

# Then use npm version to go to 0.1.0 (creates tag + commit)
npm version 0.1.0

# Push
git push origin main --tags
```

### Step 3: Monitor Build

Watch the build progress:
```
https://github.com/MotorBottle/USB-KVM-Electron/actions
```

After ~10 minutes, check your release:
```
https://github.com/MotorBottle/USB-KVM-Electron/releases/tag/v0.1.0
```

## 📦 What Gets Built

**Release v0.1.0** (stable, no pre-release badge) with:

### Windows (4 files)
- `KVM-Client-0.1.0-win-x64.exe`
- `KVM-Client-0.1.0-win-arm64.exe`
- `KVM-Client-0.1.0-win-x64-portable.exe`
- `KVM-Client-0.1.0-win-arm64-portable.exe`

### macOS (3 files)
- `KVM-Client-0.1.0-mac-universal.dmg` ⭐ (Intel + Apple Silicon)
- `KVM-Client-0.1.0-mac-x64.dmg`
- `KVM-Client-0.1.0-mac-arm64.dmg`

### Linux (4 files)
- `KVM-Client-0.1.0-linux-x64.deb` ⭐ (auto post-install)
- `KVM-Client-0.1.0-linux-arm64.deb`
- `KVM-Client-0.1.0-linux-x64.AppImage`
- `KVM-Client-0.1.0-linux-arm64.AppImage`

## 🎯 Future Releases

### Patch Release (Bug Fixes)

```bash
# Example: 0.1.0 → 0.1.1
npm version patch
git push origin main --tags
```

**When to use**: Bug fixes only, no new features

### Minor Release (New Features)

```bash
# Example: 0.1.0 → 0.2.0
npm version minor
git push origin main --tags
```

**When to use**: New features, backward compatible

### Major Release (Breaking Changes)

```bash
# Example: 0.1.0 → 1.0.0
npm version major
git push origin main --tags
```

**When to use**: Breaking changes, incompatible with previous version

## 📋 Release Checklist

Before creating release:
- [ ] All changes committed
- [ ] Tested locally: `npm run dist`
- [ ] Native module builds: `npm run build:native`
- [ ] No uncommitted changes: `git status`

After release created:
- [ ] Download and test Windows installer
- [ ] Download and test macOS DMG
- [ ] Download and test Linux .deb
- [ ] Verify Linux post-install works
- [ ] Test keyboard grabbing on all platforms
- [ ] Update README with download links

## 🐛 If Build Fails

### View Error Logs
```
GitHub Actions → Click workflow run → Click failed job → Expand step
```

### Fix and Retry
```bash
# Delete the tag
git tag -d v0.1.0
git push origin :refs/tags/v0.1.0

# Fix the issue
git add .
git commit -m "Fix build issue"
git push origin main

# Recreate tag
npm version 0.1.0 --force
git push origin --tags
```

## 🎉 Quick Commands Summary

```bash
# Full release process (copy-paste friendly)
git add .
git commit -m "Setup CI/CD and prepare v0.1.0 release"
git push origin main
npm version 0.1.0 --force
git push origin --tags

# Then wait ~10 minutes and visit:
# https://github.com/MotorBottle/USB-KVM-Electron/releases
```

## ✨ Key Points

- **First push** (commit): NO build
- **Second push** (tag): ✅ Build triggered
- **Build time**: ~10 minutes
- **Build cost**: FREE (public repo)
- **Output**: ONE release with ALL 11 installers
- **Linux .deb**: Post-install runs automatically

Ready to release v0.1.0! 🚀
