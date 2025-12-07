# Windows Build Changes - Root Cause Analysis

## Observation

When running `npm run build:native` on Windows, the following files show as "changed" in git:

1. `native/rdev-grabber/index.js`
2. `native/rdev-grabber/index.d.ts`
3. `native/rdev-grabber/package-lock.json`

Even though these are supposed to be platform-agnostic files.

## Root Causes

### 1. Line Ending Differences (CRLF vs LF)

**Most Common Cause**

- **Windows:** napi-rs generates files with `CRLF` (Carriage Return + Line Feed: `\r\n`)
- **macOS/Linux:** napi-rs generates files with `LF` (Line Feed: `\n`)

**Evidence:**
```bash
# On Windows, you might see:
git diff index.js
# Shows every line changed (^M characters or entire file rewritten)

# Or:
file index.js
# Output: index.js: ASCII text, with CRLF line terminators (Windows)

# On macOS:
file index.js
# Output: index.js: ASCII text (Unix)
```

**How to Verify:**
```bash
# On Windows
git diff --ignore-all-space --ignore-blank-lines native/rdev-grabber/index.js

# If output is empty, it's just line endings
```

---

### 2. npm/Node.js Version Differences

**package-lock.json Changes**

If your Windows and macOS machines use different npm versions:

| npm Version | package-lock.json Format |
|-------------|-------------------------|
| npm 5.x | lockfileVersion: 1 |
| npm 6.x | lockfileVersion: 1 |
| npm 7.x+ | lockfileVersion: 2 or 3 |

**Example Change:**
```json
// macOS (npm 9.x)
{
  "lockfileVersion": 3,
  "requires": true,
  "packages": { ... }
}

// Windows (npm 10.x)
{
  "lockfileVersion": 3,
  "requires": true,
  "packages": { ... },  // Different hash/integrity values
}
```

---

### 3. napi-rs CLI Version Differences

**index.js and index.d.ts Changes**

If `@napi-rs/cli` versions differ between platforms:

```bash
# Check version
cd native/rdev-grabber
npm list @napi-rs/cli

# macOS might have:
@napi-rs/cli@2.16.5

# Windows might have:
@napi-rs/cli@2.18.0  # Slightly different code generation
```

**Types of Changes:**
- Comments formatting
- Whitespace differences
- Error message text
- Code style (e.g., `require('fs')` vs `require("fs")`)

---

### 4. Node.js Version Differences

Different Node.js versions can cause:
- Different `process.report` API availability detection (line 18-28 of index.js)
- Different module resolution behavior

---

## Solutions

### Solution 1: Configure Git for Line Endings (Recommended)

**Create/Update `.gitattributes` file:**

```bash
# In project root: electron-kvm/.gitattributes
* text=auto

# Force LF for generated JavaScript files
native/rdev-grabber/index.js text eol=lf
native/rdev-grabber/index.d.ts text eol=lf

# Let npm handle package-lock.json
native/rdev-grabber/package-lock.json text eol=lf

# Binary files
*.node binary
```

**After adding .gitattributes:**

```bash
# Normalize line endings
git add --renormalize .
git commit -m "Normalize line endings"

# On Windows, rebuild
npm run build:native
git status  # Should show no changes now
```

---

### Solution 2: Pin npm and napi-rs Versions

**In `native/rdev-grabber/package.json`:**

```json
{
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "devDependencies": {
    "@napi-rs/cli": "2.16.5"  // Pin exact version, not "^2.16.5"
  }
}
```

**Then on all machines:**

```bash
cd native/rdev-grabber
npm install
# This ensures same @napi-rs/cli version
```

---

### Solution 3: Regenerate on Target Platform

**If files differ significantly:**

Option A - **Don't commit generated files** (only commit source):

```bash
# Add to .gitignore
echo "native/rdev-grabber/index.js" >> .gitignore
echo "native/rdev-grabber/index.d.ts" >> .gitignore

# Commit the change
git rm --cached native/rdev-grabber/index.js
git rm --cached native/rdev-grabber/index.d.ts
git commit -m "Stop tracking napi-rs generated files"

# Developers must build locally
npm run build:native
```

Option B - **Regenerate and commit on primary platform** (pick one platform as source of truth):

```bash
# On Windows (your primary platform)
npm run build:native
git add native/rdev-grabber/index.js native/rdev-grabber/index.d.ts
git commit -m "Regenerate napi-rs files on Windows"

# macOS will show changes, but don't commit them
```

---

### Solution 4: Use Prettier/EditorConfig for Consistency

**Create `.editorconfig` in project root:**

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true

[*.{js,ts,json}]
indent_style = space
indent_size = 2

[*.node]
end_of_line = unset
```

**Then format files:**

```bash
npx prettier --write native/rdev-grabber/index.js
npx prettier --write native/rdev-grabber/index.d.ts
git add native/rdev-grabber/
git commit -m "Format with prettier"
```

---

## Recommended Solution: Combined Approach

**Step 1: Create `.gitattributes`**

```bash
# In electron-kvm/.gitattributes
* text=auto
*.js text eol=lf
*.ts text eol=lf
*.d.ts text eol=lf
*.json text eol=lf
*.node binary
*.dll binary
*.dylib binary
*.so binary
```

**Step 2: Pin napi-rs version**

```bash
cd native/rdev-grabber
# Edit package.json, change:
#   "@napi-rs/cli": "^2.16.5"
# To:
#   "@napi-rs/cli": "2.16.5"

npm install
```

**Step 3: Normalize existing files**

```bash
# On Windows or macOS (pick one as source of truth)
git add --renormalize .
npm run build:native
git add native/rdev-grabber/index.js native/rdev-grabber/index.d.ts
git commit -m "Normalize line endings and pin napi-rs version"
git push
```

**Step 4: Verify on other platform**

```bash
# On the other platform
git pull
npm run build:native
git status  # Should show no changes
```

---

## Quick Diagnostic Commands

**On Windows (PowerShell or Git Bash):**

```bash
# Check line endings
git ls-files --eol native/rdev-grabber/index.js

# Should show: i/lf w/lf attr/text=auto index.js
# If shows CRLF, that's the issue

# Check what git sees as changed
git diff native/rdev-grabber/index.js | head -20

# Check npm version
npm --version

# Check napi-rs version
cd native/rdev-grabber && npm list @napi-rs/cli

# Check if it's just whitespace
git diff -w native/rdev-grabber/index.js
```

---

## Explanation: Why This Happens

### napi-rs Code Generation Process

1. **Parse Rust code** → Extract exported functions
2. **Generate TypeScript definitions** → Create `index.d.ts`
3. **Generate JavaScript loader** → Create `index.js` with platform detection
4. **Compile Rust** → Create `.node` binary

The generation (steps 2-3) uses Node.js to write files, which respects:
- OS line endings (`os.EOL`)
- Node.js version's `fs.writeFileSync` behavior
- npm's handling of `package-lock.json`

### Why package-lock.json Changes

`package-lock.json` changes because:

1. **Integrity hashes** - Calculated differently based on npm version
2. **Optional dependencies** - Resolved differently per platform
3. **Registry metadata** - Timestamp of npm registry query
4. **npm version** - Format changes between npm 7/8/9/10

**Example:**
```json
// macOS npm 9
"node_modules/@napi-rs/cli": {
  "version": "2.16.5",
  "resolved": "https://registry.npmjs.org/@napi-rs/cli/-/cli-2.16.5.tgz",
  "integrity": "sha512-abcdef..."
}

// Windows npm 10
"node_modules/@napi-rs/cli": {
  "version": "2.16.5",
  "resolved": "https://registry.npmjs.org/@napi-rs/cli/-/cli-2.16.5.tgz",
  "integrity": "sha512-123456...",  // Different hash!
  "engines": { "node": ">= 10" }  // Extra metadata
}
```

---

## What Should You Commit?

| File | Commit? | Why |
|------|---------|-----|
| `index.js` | ✅ Yes | Required for package to work |
| `index.d.ts` | ✅ Yes | TypeScript definitions |
| `package-lock.json` | ⚠️ Maybe | Depends on team workflow |
| `*.node` | ❌ No | Platform-specific binary |
| `target/` | ❌ No | Build artifacts |

### package-lock.json Decision Tree

**Commit if:**
- ✅ You want reproducible builds across team
- ✅ You're building a deployable application
- ✅ You use CI/CD that needs exact versions

**Don't commit if:**
- ❌ You're building a library (package)
- ❌ Team uses different npm versions frequently
- ❌ Causes too many merge conflicts

**For electron-kvm (application):**
- ✅ **Recommend committing** package-lock.json
- But designate **one platform as source of truth** (e.g., Windows)
- Other platforms shouldn't commit package-lock.json changes

---

## Immediate Action Plan

**What to do right now:**

1. **Don't commit the changes yet** - Understand them first

2. **Check what actually changed:**
   ```bash
   # On Windows
   git diff native/rdev-grabber/index.js
   git diff native/rdev-grabber/index.d.ts
   git diff native/rdev-grabber/package-lock.json
   ```

3. **If it's just line endings:**
   - Create `.gitattributes` (see Solution 1)
   - Run `git add --renormalize .`
   - Commit once

4. **If it's real changes (new functions, etc.):**
   - Commit them normally
   - This is legitimate API evolution

5. **If it's npm version differences:**
   - Choose Windows as source of truth
   - Commit package-lock.json from Windows
   - macOS users should not commit package-lock.json changes

---

## Long-Term Recommendation

**Best Practice for Cross-Platform Native Development:**

```
Project Structure:
├── .gitattributes         ← Force LF line endings
├── .editorconfig          ← Consistent formatting
├── native/
│   └── rdev-grabber/
│       ├── package.json   ← Pin exact napi-rs version
│       ├── package-lock.json  ← Commit from ONE platform only
│       ├── index.js       ← Commit with LF endings
│       ├── index.d.ts     ← Commit with LF endings
│       └── *.node         ← Never commit (gitignored)
```

**Team Workflow:**
1. Windows developer is primary (since you're on Windows)
2. Windows commits: `index.js`, `index.d.ts`, `package-lock.json`
3. macOS developers: Build locally, don't commit these files
4. CI/CD: Builds on both platforms, doesn't commit

This avoids the "build → different files → commit → conflict → repeat" cycle.
