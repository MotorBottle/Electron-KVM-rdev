# Quick Fix: Stop Windows Build From Changing Files

## Problem
`npm run build:native` on Windows marks these as changed:
- `index.js`
- `index.d.ts`
- `package-lock.json`

## Root Cause
Line endings: Windows uses CRLF (`\r\n`), macOS uses LF (`\n`)

## Solution (5 minutes)

### On Windows:

```bash
# 1. Add .gitattributes (already created)
git add .gitattributes

# 2. Normalize all files to LF
git add --renormalize .

# 3. Commit the fix
git commit -m "Fix: Normalize line endings for cross-platform builds"

# 4. Rebuild to verify
npm run build:native

# 5. Check - should be clean now
git status
```

### Expected Result:
```
On branch main
nothing to commit, working tree clean  ✅
```

## If Still Showing Changes

### Check if it's just whitespace:
```bash
git diff -w native/rdev-grabber/index.js
```

**If empty:** It's line endings, the fix will work after push/pull cycle

**If not empty:** You actually changed the API (legitimate change)

### For package-lock.json:

Choose one:
- **Option 1:** Commit it from Windows (your platform is source of truth)
- **Option 2:** Add to `.gitignore` if keeps conflicting

## Done!

After this fix:
- ✅ Windows builds won't change `index.js` or `index.d.ts`
- ✅ macOS builds won't change them either
- ✅ Cross-platform development is smooth

## Files Created
- `.gitattributes` - Enforces LF line endings
- `FIX_WINDOWS_BUILD_CHANGES.md` - Detailed explanation
- `WINDOWS_BUILD_CHANGES.md` - Root cause analysis
- `QUICK_FIX.md` - This file
