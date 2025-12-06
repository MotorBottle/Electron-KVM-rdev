# Linux Key Mapping and Grab Thread Fix

## Issues Identified

### 1. Key Mapping Problem
**Symptom**: Most keys mapped incorrectly, only Ctrl/Alt/Meta work correctly

**Root Cause**:
- In RustDesk's rdev fork, the `Event.usb_hid` field is hardcoded to `0` on Linux (see `/tmp/rdev-check/src/linux/grab.rs:156`)
- The previous Linux implementation was calling `rdev::code_from_key()` which defaults to Linux keycodes, NOT USB HID codes
- Need to explicitly use `rdev::usb_hid_keycode_from_key()` to get correct USB HID mappings

**Fix Applied**:
```rust
// Added import
#[cfg(target_os = "linux")]
use rdev::{..., usb_hid_keycode_from_key};

// Changed from:
let usb_hid = rdev::code_from_key(key).map(|v| v as u32).unwrap_or(event.usb_hid as u32);

// To:
let usb_hid = usb_hid_keycode_from_key(key).unwrap_or(0);
```

### 2. Grab Thread Immediately Exiting
**Symptom**: Console shows "rdev grab thread starting" then immediately "thread exiting"

**Possible Causes**:
1. **Permissions Issue**: User may not have proper evdev access even after being in `input` group
   - Requires logout/login after adding to group
   - Check with: `groups` (should show `input`)
   - Verify evdev access: `ls -la /dev/input/event*`

2. **X11 Not Running**: The `start_grab_listen()` only works on X11
   - Ubuntu 22.04+ defaults to Wayland
   - Check session: `echo $XDG_SESSION_TYPE` (should be `x11`)
   - Switch to X11: Log out, click gear icon, select "Ubuntu on Xorg"

3. **KEYBOARD_ONLY Environment Variable**: May need to be set earlier
   - Currently set at line 53 before spawning thread
   - Thread inherits this, should be fine

4. **Error in Callback**: If callback crashes, it will return immediately
   - Added extensive debug logging to see events

**Debug Logging Added**:
```rust
eprintln!("enable_grab() called");
eprintln!("start_grab_listen callback received event: {:?}", event.event_type);
eprintln!("Linux key event: {:?}, usb_hid: 0x{:02X}", key, usb_hid);
eprintln!("start_grab_listen returned (should not happen unless error or exit)");
```

## Changes Made

### File: `native/rdev-grabber/src/lib.rs`

1. **Lines 9-10**: Added `usb_hid_keycode_from_key` import for Linux
2. **Lines 75-106**: Rewrote Linux implementation with:
   - Correct USB HID code mapping using `usb_hid_keycode_from_key()`
   - Extensive debug logging
   - Clearer comments explaining the issue

## Testing Instructions

### Build
```bash
cd /path/to/electron-kvm
npm run build:native
```

### Test Checklist

1. **Verify Session Type**:
   ```bash
   echo $XDG_SESSION_TYPE
   # Should output: x11
   # If it says 'wayland', log out and select "Ubuntu on Xorg"
   ```

2. **Verify Permissions**:
   ```bash
   groups
   # Should include: input (or plugdev on some distros)

   ls -la /dev/input/event* | head -5
   # Should show: crw-rw---- ... root input ...
   ```

3. **Run Application and Check Console Output**:
   - Start electron-kvm
   - Click video stream to enter control mode
   - Watch console for debug messages:
     ```
     rdev grab thread starting
     enable_grab() called
     [Should stay running, NOT immediately show "thread exiting"]
     ```

4. **Press Keys and Check Mapping**:
   - When you press a key, should see:
     ```
     start_grab_listen callback received event: KeyPress(...)
     Linux key event: KeyA, usb_hid: 0x04
     Creating KeyEvent: type=down, key=KeyA, code=KeyA, usb_hid=4
     ```
   - USB HID codes should be non-zero (except for unmapped keys)
   - Examples:
     - `KeyA` = 0x04
     - `KeyB` = 0x05
     - `Num1` = 0x1E
     - `Return` = 0x28
     - `Space` = 0x2C
     - `ControlLeft` = 0xE0

5. **Test Keyboard Control**:
   - Type letters, numbers, symbols
   - All keys should now map correctly to remote device
   - Modifiers (Ctrl/Alt/Shift/Meta) should work correctly

## Expected Behavior After Fix

✅ **Key Mapping**: All keyboard keys should map correctly via USB HID codes
✅ **Grab Thread**: Should stay running until you click to exit control mode
✅ **Debug Output**: Should see event logging for each keypress/release

## Troubleshooting

### If thread still exits immediately:

1. **Check X11**:
   ```bash
   ps aux | grep X
   # Should see Xorg process running
   ```

2. **Check rdev error message**:
   - Look for "rdev grab error:" in console
   - Common errors:
     - `MissingDisplayError`: Not running in X11
     - `PermissionDenied`: evdev access issue
     - `IoError`: Device access problem

3. **Test evdev access directly**:
   ```bash
   sudo cat /dev/input/event0
   # Press some keys, should see binary output
   # Ctrl+C to stop

   # Now test without sudo (should work if in input group):
   cat /dev/input/event0
   # If "Permission denied", reboot or re-add to input group
   ```

4. **Fallback - Run as root (temporary debugging only)**:
   ```bash
   sudo npm run dev
   # If this works, it confirms permissions issue
   # Do NOT run as root in production!
   ```

### If keys still map incorrectly:

1. **Check USB HID values in debug output**:
   - Should be non-zero hex values
   - If still seeing 0x00 for most keys, check import statement

2. **Verify rdev fork version**:
   ```bash
   cd native/rdev-grabber
   grep 'rdev.*git' Cargo.toml
   # Should show: rustdesk-org/rdev
   ```

## Reference: USB HID Codes

Common USB HID Usage IDs (for verification):
- Letters: A=0x04, B=0x05, ..., Z=0x1D
- Numbers: 1=0x1E, 2=0x1F, ..., 0=0x27
- Special: Enter=0x28, Esc=0x29, Backspace=0x2A, Tab=0x2B, Space=0x2C
- Modifiers: LCtrl=0xE0, LShift=0xE1, LAlt=0xE2, LMeta=0xE3

Full reference: https://usb.org/sites/default/files/hut1_21.pdf (page 83)

## Next Steps

After testing on Linux:
1. Report back with debug console output
2. Test various keys (letters, numbers, symbols, modifiers, function keys)
3. If thread still exits, provide the error message from debug output
4. If keys still map incorrectly, provide examples of what you press vs what gets sent
