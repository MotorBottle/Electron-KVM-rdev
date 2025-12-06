# Linux Keyboard Grabbing - Quick Fix Summary

## What Was Wrong

### Problem 1: Keys Mapped Incorrectly
- **Why**: Used wrong function for USB HID codes on Linux
- **Fix**: Changed from `rdev::code_from_key()` to `rdev::usb_hid_keycode_from_key()`

### Problem 2: Thread Exited Immediately
- **Why #1**: Called `enable_grab()` before `start_grab_listen()` (wrong order)
  - `enable_grab()` tried to send to a channel that didn't exist yet
- **Why #2**: Parent thread exited after `start_grab_listen()` returned
  - On Linux, `start_grab_listen()` spawns background threads and returns immediately
  - On Windows/macOS, `grab()` blocks the thread until stopped
- **Fix**:
  1. Correct order: `start_grab_listen()` → `enable_grab()`
  2. Keep parent thread alive with sleep loop while `RUNNING` is true

## What Changed

**File**: [native/rdev-grabber/src/lib.rs](native/rdev-grabber/src/lib.rs)

```rust
// BEFORE (broken):
enable_grab();                     // ❌ Channel doesn't exist yet
start_grab_listen(callback)?;      // Creates channel
// Thread exits immediately         // ❌ Background threads orphaned

// AFTER (fixed):
start_grab_listen(callback)?;      // ✅ Creates channel first
enable_grab();                     // ✅ Now can send to channel
while RUNNING.load(...) {          // ✅ Keep thread alive
    thread::sleep(...);
}
```

## Expected Console Output

### Before Fix
```
rdev grab thread starting
enable_grab() called
start_grab_listen returned (should not happen unless error or exit)
rdev grab thread exiting
[No key events captured]
```

### After Fix
```
rdev grab thread starting
Calling start_grab_listen()...
start_grab_listen() returned Ok - background threads started
enable_grab() called - keyboard grabbing enabled
[Thread stays alive]

[When you press a key:]
start_grab_listen callback received event: KeyPress(KeyA)
Linux key event: KeyA, usb_hid: 0x04
Creating KeyEvent: type=down, key=KeyA, code=KeyA, usb_hid=4

[When you exit control mode:]
RUNNING flag set to false, exiting grab thread
rdev grab thread exiting
```

## Testing

1. **Build**: `npm run build:native`
2. **Run**: Start app and click video stream to enter control mode
3. **Verify**:
   - Thread should stay alive (no immediate "exiting" message)
   - Pressing keys should show callback events
   - USB HID codes should be non-zero (e.g., KeyA=0x04, Space=0x2C)
4. **Exit**: Click to leave control mode, thread should exit cleanly

## Requirements

- ✅ X11 session (not Wayland) - check with `echo $XDG_SESSION_TYPE`
- ✅ User in `input` group - check with `groups`
- ✅ HID device permissions - run `assets/post-install.sh`

## Full Documentation

See [LINUX_FIX_SUMMARY.md](LINUX_FIX_SUMMARY.md) for detailed explanation and troubleshooting.
