# Release Guide: Creating Releases with GitHub Actions

## Quick Answer

**Tags are created locally and pushed to GitHub.** When you push a tag, GitHub Actions automatically:
1. Builds all platforms (Windows, macOS, Linux)
2. Creates ONE release
3. Uploads all built files to that single release

## Step-by-Step: Creating a Release

### Option 1: Using npm version (Recommended)

```bash
# 1. Make sure you're on main branch with all changes committed
git checkout main
git pull

# 2. Update version in package.json and create git tag automatically
npm version patch    # 1.0.0 → 1.0.1 (bug fixes)
# or
npm version minor    # 1.0.0 → 1.1.0 (new features)
# or
npm version major    # 1.0.0 → 2.0.0 (breaking changes)

# This creates a tag like "v1.0.1" automatically

# 3. Push the commit AND the tag
git push origin main --tags

# 4. Wait ~10 minutes - GitHub Actions will:
#    - Build Windows x64 + arm64
#    - Build macOS x64 + arm64
#    - Build Linux x64 + arm64
#    - Create ONE release named "v1.0.1"
#    - Upload ALL 6+ installer files to that release
```

### Option 2: Manual Tag Creation

```bash
# 1. Commit all changes
git add .
git commit -m "Ready for v1.0.1 release"

# 2. Create a tag manually
git tag -a v1.0.1 -m "Release version 1.0.1"

# 3. Push the tag
git push origin v1.0.1

# GitHub Actions triggers automatically
```

## What Happens When You Push a Tag

### Timeline

```
You push v1.0.1
    ↓
GitHub receives tag (triggers workflow)
    ↓
GitHub Actions starts 3 parallel jobs:
    ┌────────────────────────────────────┐
    │ Job 1: Windows (takes ~8 min)      │
    │ Job 2: macOS   (takes ~10 min)     │
    │ Job 3: Linux   (takes ~6 min)      │
    └────────────────────────────────────┘
    ↓ (All jobs finish)
GitHub Actions Release Job:
    ↓
1. Creates release "v1.0.1"
2. Downloads artifacts from all 3 jobs
3. Uploads ALL files to ONE release:
   - KVM-Client-1.0.1-win-x64.exe
   - KVM-Client-1.0.1-win-arm64.exe
   - KVM-Client-1.0.1-mac-universal.dmg
   - KVM-Client-1.0.1-linux-x64.deb
   - KVM-Client-1.0.1-linux-x64.AppImage
   - ... (more files)
    ↓
Release is LIVE on GitHub!
```

## Where to Find Your Release

After pushing a tag, go to your GitHub repository:

```
https://github.com/MotorBottle/USB-KVM-Electron/releases
```

You'll see:
- **Release name**: v1.0.1
- **Release notes**: Auto-generated from commits
- **Assets**: All installer files (9-12 files total)

## Release Assets Structure

ONE release contains ALL these files:

```
Release: v1.0.1
├── Windows Installers
│   ├── KVM-Client-1.0.1-win-x64.exe (NSIS installer)
│   ├── KVM-Client-1.0.1-win-arm64.exe
│   ├── KVM-Client-1.0.1-win-x64-portable.exe
│   └── KVM-Client-1.0.1-win-arm64-portable.exe
├── macOS Installers
│   ├── KVM-Client-1.0.1-mac-universal.dmg (Intel + Apple Silicon)
│   ├── KVM-Client-1.0.1-mac-x64.dmg (Intel only)
│   └── KVM-Client-1.0.1-mac-arm64.dmg (Apple Silicon only)
├── Linux Installers
│   ├── KVM-Client-1.0.1-linux-x64.deb (with auto post-install)
│   ├── KVM-Client-1.0.1-linux-arm64.deb
│   ├── KVM-Client-1.0.1-linux-x64.AppImage
│   └── KVM-Client-1.0.1-linux-arm64.AppImage
└── Source Code
    ├── Source code (zip)
    └── Source code (tar.gz)
```

## How the Workflow Ensures One Release

### In `.github/workflows/build.yml`:

```yaml
# Step 1: Each platform job uploads its files as artifacts
jobs:
  build-windows:
    runs-on: windows-latest
    steps:
      - name: Build
        run: npm run dist
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: windows-installers  # Temporary storage
          path: dist/*.exe

  build-macos:
    # Similar - uploads to artifacts named "macos-installers"

  build-linux:
    # Similar - uploads to artifacts named "linux-installers"

  # Step 2: Release job waits for ALL build jobs to finish
  release:
    needs: [build-windows, build-macos, build-linux]  # Waits for all 3
    runs-on: ubuntu-latest
    steps:
      - name: Download all artifacts
        uses: actions/download-artifact@v3
        with:
          path: release-assets/
        # Downloads:
        #   release-assets/windows-installers/*.exe
        #   release-assets/macos-installers/*.dmg
        #   release-assets/linux-installers/*.{deb,AppImage}

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: ${{ github.ref_name }}  # v1.0.1
          name: Release ${{ github.ref_name }}
          files: release-assets/**/*  # Upload ALL files from all platforms
          draft: false
          prerelease: false
```

## Tag Naming Conventions

### Stable Releases
```bash
git tag v1.0.0   # Stable release
git tag v1.0.1   # Bug fix release
git tag v1.1.0   # Minor feature release
git tag v2.0.0   # Major breaking changes
```

### Pre-Releases
```bash
git tag v1.0.0-beta.1    # Beta release (marked as pre-release)
git tag v1.0.0-rc.1      # Release candidate
git tag v1.0.0-alpha.1   # Alpha release
```

GitHub Actions will:
- Detect `-beta`, `-rc`, `-alpha` in tag name
- Mark release as "Pre-release" automatically
- Users see ⚠️ icon next to release

## Viewing Build Progress

### While Building

1. Go to: `https://github.com/MotorBottle/USB-KVM-Electron/actions`
2. Click on the workflow run for your tag
3. See all 3 jobs running in parallel:
   - ✅ build-windows
   - 🔄 build-macos (in progress)
   - ⏳ build-linux (queued)

### When Complete

All jobs show ✅ and release job creates the release with ALL files.

## Testing Before Release

### Draft Releases (Optional)

Modify workflow to create draft releases first:

```yaml
# In .github/workflows/build.yml
- name: Create Release
  with:
    draft: true  # Release created but not visible to public
```

Then manually:
1. Test all installers
2. Edit release notes
3. Click "Publish release" when ready

### Test Builds Without Release

Push to a branch instead of a tag:

```bash
git push origin feature-branch

# Workflow builds but doesn't create release
# Artifacts available for 90 days in Actions tab
```

## Deleting Tags (If Mistake)

### Delete Local Tag
```bash
git tag -d v1.0.1
```

### Delete Remote Tag
```bash
git push origin :refs/tags/v1.0.1
```

### Delete Release
Go to GitHub → Releases → Click release → Delete release

## Common Scenarios

### Scenario 1: Forgot to Update Version
```bash
# You pushed v1.0.1 but package.json still says 1.0.0

# Fix:
git tag -d v1.0.1                    # Delete local tag
git push origin :refs/tags/v1.0.1   # Delete remote tag
npm version 1.0.1 --no-git-tag-version  # Update package.json only
git add package.json
git commit -m "Update version to 1.0.1"
git tag v1.0.1                       # Re-create tag
git push origin main --tags          # Push again
```

### Scenario 2: Build Failed
```bash
# One platform failed to build

# Option 1: Fix and re-tag
git tag -d v1.0.1
git push origin :refs/tags/v1.0.1
# Fix the issue
git commit -m "Fix build issue"
git tag v1.0.1
git push origin main --tags

# Option 2: Create patch release
npm version patch  # v1.0.2
git push origin main --tags
```

### Scenario 3: Want Different Files in Release
```bash
# Modify electron-builder config in package.json
# Change target platforms, formats, etc.
git commit -m "Update build config"
npm version patch
git push origin main --tags
```

## Automation Details

### What GitHub Actions Does Automatically

1. **Detects tag push**: `refs/tags/v*`
2. **Parses version**: Extracts `1.0.1` from `v1.0.1`
3. **Builds all platforms**: Parallel execution
4. **Collects artifacts**: Downloads from all build jobs
5. **Creates ONE release**: Named after the tag
6. **Uploads ALL files**: To that single release
7. **Generates changelog**: From git commits since last tag
8. **Sends notifications**: (Optional) via webhooks/email

### What You Need to Do

1. **Create tag**: `npm version patch`
2. **Push tag**: `git push origin main --tags`
3. **Wait**: ~10 minutes
4. **Done**: Release is live!

## Summary Table

| Action | Command | Result |
|--------|---------|--------|
| Create patch release | `npm version patch && git push origin main --tags` | v1.0.0 → v1.0.1 |
| Create minor release | `npm version minor && git push origin main --tags` | v1.0.0 → v1.1.0 |
| Create major release | `npm version major && git push origin main --tags` | v1.0.0 → v2.0.0 |
| View releases | Visit `github.com/USER/REPO/releases` | See all releases |
| Download installer | Click asset in release | Get .exe/.dmg/.deb file |

## Next Steps

Ready to implement the GitHub Actions workflow? I can create:
1. `.github/workflows/build.yml` - The complete workflow
2. Test it with a dry-run
3. Walk through the first release together
