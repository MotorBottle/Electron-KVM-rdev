# Fix: Windows Build Changes in Git

## Problem Summary

When running `npm run build:native` on Windows, these files show as changed:
1. ✅ `native/rdev-grabber/index.js`
2. ✅ `native/rdev-grabber/index.d.ts`
3. ✅ `native/rdev-grabber/package-lock.json`

## Root Causes Identified

1. **Line Endings**: Windows generates CRLF (`\r\n`), macOS generates LF (`\n`)
2. **npm Registry**: macOS uses Chinese mirror (`registry.npmmirror.com`), Windows might use default (`registry.npmjs.org`)
3. **napi-rs Version**: Using `^2.18.0` (allows 2.18.x updates) instead of exact version

## Solution Applied

### ✅ Step 1: Created `.gitattributes` (DONE)

File created at: `.gitattributes`

This forces all JavaScript/TypeScript files to use LF line endings on all platforms.

**Contents:**
```
# Auto-detect text files and normalize line endings to LF
* text=auto

# Source code - always use LF
*.js text eol=lf
*.ts text eol=lf
*.json text eol=lf
# ... (full content in file)
```

### ⚠️ Step 2: Normalize Line Endings (DO THIS ON WINDOWS)

**On your Windows machine:**

```bash
# Navigate to project root
cd C:\Users\Motor\Documents\VscodeProj\USB-KVM-rdev

# Add the .gitattributes file
git add .gitattributes

# Normalize all existing files to use correct line endings
git add --renormalize .

# Check what changed
git status

# Commit the normalization
git commit -m "Add .gitattributes and normalize line endings"

# Now rebuild native module
npm run build:native

# Check if files still show as changed
git status

# Expected: No changes to index.js or index.d.ts
```

### 📝 Step 3: Handle package-lock.json (CHOOSE ONE OPTION)

**Option A: Commit from Windows (Recommended)**

Since you're the primary developer on Windows, make Windows the source of truth:

```bash
# On Windows, after building
npm run build:native

# Check what changed in package-lock.json
git diff native/rdev-grabber/package-lock.json

# If it's just registry URL or integrity hash differences, commit it
git add native/rdev-grabber/package-lock.json
git commit -m "Update package-lock.json from Windows build"
git push

# On macOS (don't commit package-lock.json changes)
git pull
npm run build:native
# If package-lock.json shows as changed, discard it:
git checkout native/rdev-grabber/package-lock.json
```

**Option B: Use Same npm Registry (Alternative)**

If you want both platforms to generate identical package-lock.json:

```bash
# On Windows, switch to same registry as macOS
npm config set registry https://registry.npmmirror.com

# Then rebuild
cd native/rdev-grabber
rm package-lock.json
npm install
npm run build

# Check if this makes it consistent
git diff package-lock.json
```

**Option C: Ignore package-lock.json in Native Module**

If it keeps causing conflicts:

```bash
# Add to .gitignore
echo "native/rdev-grabber/package-lock.json" >> .gitignore

# Remove from git
git rm --cached native/rdev-grabber/package-lock.json
git commit -m "Stop tracking native module package-lock.json"

# Each developer maintains their own
```

### 🔒 Step 4: Pin napi-rs Version (Optional but Recommended)

**Edit `native/rdev-grabber/package.json`:**

Change this:
```json
"devDependencies": {
  "@napi-rs/cli": "^2.18.0"
}
```

To this (exact version):
```json
"devDependencies": {
  "@napi-rs/cli": "2.18.4"
}
```

Then:
```bash
cd native/rdev-grabber
npm install
git add package.json package-lock.json
git commit -m "Pin napi-rs to exact version 2.18.4"
```

This ensures both platforms use the exact same code generator.

## Verification

After applying the fix, verify on Windows:

```bash
# Build
npm run build:native

# Check git status
git status

# Should show:
# - No changes to index.js (line endings fixed by .gitattributes)
# - No changes to index.d.ts (line endings fixed by .gitattributes)
# - Maybe changes to package-lock.json (decide based on Step 3)
```

## Testing the Fix

### Test 1: Line Endings

```bash
# On Windows (Git Bash or PowerShell)
git ls-files --eol native/rdev-grabber/index.js

# Should show:
# i/lf    w/lf    attr/text eol=lf    native/rdev-grabber/index.js
#  ^^^     ^^^                         ^-- working tree uses LF
#  |       |-- index uses LF
#  |-- file identified as text
```

### Test 2: No Content Changes

```bash
# Check if changes are just whitespace/line endings
git diff -w native/rdev-grabber/index.js

# Should show: (empty) if only line endings changed
```

### Test 3: Cross-Platform Consistency

```bash
# On Windows - build and check
npm run build:native
git diff native/rdev-grabber/index.js

# On macOS - build and check
npm run build:native
git diff native/rdev-grabber/index.js

# Both should show no changes (or identical changes if API changed)
```

## Expected Results

### Before Fix
```
PS> npm run build:native
PS> git status

Changes not staged for commit:
  modified:   native/rdev-grabber/index.js       ← Every line changed (CRLF)
  modified:   native/rdev-grabber/index.d.ts     ← Every line changed (CRLF)
  modified:   native/rdev-grabber/package-lock.json ← Registry differences
```

### After Fix
```
PS> npm run build:native
PS> git status

On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean  ← ✅ Success!
```

## Troubleshooting

### Issue 1: "Still showing changes after .gitattributes"

```bash
# Force git to re-check line endings
git rm --cached -r .
git reset --hard
git add .
git status
```

### Issue 2: "index.js content actually changed"

```bash
# Check if it's real API changes
git diff native/rdev-grabber/index.js

# If you see new function exports like:
# +module.exports.set_keyboard_hook_enabled = set_keyboard_hook_enabled

# This is legitimate - you changed the Rust API
# Commit it normally
```

### Issue 3: "package-lock.json always differs"

This is normal if:
- Different npm versions (Windows npm 10 vs macOS npm 9)
- Different registries (npmjs.org vs npmmirror.com)

**Solution:** Choose Option A, B, or C from Step 3 above.

## Summary of Files Created

1. ✅ `.gitattributes` - Forces LF line endings for text files
2. ✅ `WINDOWS_BUILD_CHANGES.md` - Detailed analysis of the problem
3. ✅ `FIX_WINDOWS_BUILD_CHANGES.md` - This file (step-by-step fix)
4. ✅ `NATIVE_BUILD_CHANGES.md` - General build process documentation

## Next Steps

**On Windows (Your Primary Development Machine):**

```bash
# 1. Add .gitattributes
git add .gitattributes

# 2. Normalize line endings
git add --renormalize .

# 3. Commit
git commit -m "Fix: Normalize line endings for cross-platform builds"

# 4. Rebuild native module
npm run build:native

# 5. Verify no changes
git status

# 6. If still shows changes, check what they are:
git diff native/rdev-grabber/index.js | head -50

# 7. Push changes
git push
```

**On macOS (After pulling changes):**

```bash
# 1. Pull the fix
git pull

# 2. Rebuild
npm run build:native

# 3. Should show no changes now
git status

# Expected: clean working tree
```

## Long-Term Best Practice

**Recommended Workflow:**

1. ✅ `.gitattributes` committed (forces consistent line endings)
2. ✅ Pin exact napi-rs version (prevents generation differences)
3. ✅ Windows as source of truth for package-lock.json
4. ✅ macOS developers: rebuild locally, don't commit generated files

This prevents the cycle:
```
Windows build → commit → macOS build → different → commit → Windows build → different → ...
```

## Questions?

**Q: Why does package-lock.json change?**
A: Different npm versions and registries generate different integrity hashes.

**Q: Should I commit index.js and index.d.ts?**
A: Yes, but with `.gitattributes` they should be identical across platforms.

**Q: Why does this happen with napi-rs?**
A: napi-rs generates files using Node.js, which respects OS line endings by default.

**Q: Will this break anything?**
A: No - LF line endings work on all platforms (Windows, macOS, Linux).

**Q: What if I already have CRLF committed?**
A: `git add --renormalize .` converts them to LF in the repository.
