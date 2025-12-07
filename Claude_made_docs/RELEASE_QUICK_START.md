# Quick Start: Creating v0.1.0-beta Release

## ✅ What's Ready

1. **GitHub Actions workflow**: `.github/workflows/release.yml`
2. **Version set**: `0.1.0-beta` in `package.json`
3. **Build trigger**: Tag push only (Option A - saves Actions minutes)

## 🚀 Create First Release (3 Commands)

```bash
# 1. Commit the workflow and version
git add .github/workflows/release.yml package.json
git commit -m "Add CI/CD workflow and set version to 0.1.0-beta"
git push origin main

# 2. Create and push tag (this triggers build!)
git tag v0.1.0-beta
git push origin v0.1.0-beta

# 3. Wait ~10 minutes, then visit:
# https://github.com/MotorBottle/USB-KVM-Electron/releases
```

## 📦 What Gets Built

**One release with ALL these files:**

```
Release: v0.1.0-beta (Pre-release ⚠️)
├── Windows
│   ├── KVM-Client-0.1.0-beta-win-x64.exe
│   ├── KVM-Client-0.1.0-beta-win-arm64.exe
│   ├── KVM-Client-0.1.0-beta-win-x64-portable.exe
│   └── KVM-Client-0.1.0-beta-win-arm64-portable.exe
├── macOS
│   ├── KVM-Client-0.1.0-beta-mac-universal.dmg
│   ├── KVM-Client-0.1.0-beta-mac-x64.dmg
│   └── KVM-Client-0.1.0-beta-mac-arm64.dmg
└── Linux
    ├── KVM-Client-0.1.0-beta-linux-x64.deb (auto post-install ✨)
    ├── KVM-Client-0.1.0-beta-linux-arm64.deb
    ├── KVM-Client-0.1.0-beta-linux-x64.AppImage
    └── KVM-Client-0.1.0-beta-linux-arm64.AppImage
```

## 🎯 Build Timeline

```
Push tag v0.1.0-beta
    ↓
GitHub Actions starts (parallel builds)
    ↓
┌────────────┬────────────┬────────────┐
│  Windows   │   macOS    │   Linux    │
│   ~8 min   │  ~10 min   │   ~6 min   │
└─────┬──────┴──────┬─────┴──────┬─────┘
      └─────────────┴────────────┘
                ↓
         create-release job
         (collects all files)
                ↓
      Release v0.1.0-beta LIVE!
         (~10 min total)
```

## 🔍 Monitor Progress

While building, watch at:
```
https://github.com/MotorBottle/USB-KVM-Electron/actions
```

You'll see 4 jobs:
- ✅ build-windows
- 🔄 build-macos (in progress)
- ⏳ build-linux (queued)
- ⏸️ create-release (waiting for all 3)

## ⚠️ Important Notes

1. **First push** (commit workflow): NO build triggered
2. **Second push** (tag): ✅ Build triggered
3. **Pre-release badge**: Automatic (because tag contains "-beta")
4. **Linux .deb**: Post-install script runs automatically on install
5. **Free builds**: Unlimited for public repos

## 🐛 If Build Fails

Check logs at: `GitHub Actions → Click workflow → Click failed job`

Fix and retry:
```bash
# Delete old tag
git tag -d v0.1.0-beta
git push origin :refs/tags/v0.1.0-beta

# Fix issue, commit, recreate tag
git add .
git commit -m "Fix build issue"
git tag v0.1.0-beta
git push origin v0.1.0-beta
```

## 📚 Full Documentation

- [FIRST_RELEASE_GUIDE.md](FIRST_RELEASE_GUIDE.md) - Complete walkthrough
- [RELEASE_GUIDE.md](RELEASE_GUIDE.md) - Tag naming & release process
- [CI_CD_PLAN.md](CI_CD_PLAN.md) - Architecture overview

## 🎉 Ready to Release!

Run the 3 commands above to create your first beta release!
