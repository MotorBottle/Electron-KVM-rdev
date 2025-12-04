#![deny(clippy::all)]

use napi::bindgen_prelude::*;
use napi::threadsafe_function::{ErrorStrategy, ThreadsafeFunction, ThreadsafeFunctionCallMode};
use napi_derive::napi;
use rdev::{exit_grab, Event, EventType, Key};
#[cfg(any(target_os = "windows", target_os = "macos"))]
use rdev::{grab, KeyCode};
#[cfg(target_os = "linux")]
use rdev::{disable_grab, enable_grab, exit_grab_listen, start_grab_listen};
#[cfg(target_os = "macos")]
use rdev::set_is_main_thread;
#[cfg(target_os = "windows")]
use rdev::set_event_popup;
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;

static RUNNING: AtomicBool = AtomicBool::new(false);
static KEYBOARD_HOOKED: AtomicBool = AtomicBool::new(false);
static CTRL_HELD: AtomicBool = AtomicBool::new(false);
static ALT_HELD: AtomicBool = AtomicBool::new(false);
static SHIFT_HELD: AtomicBool = AtomicBool::new(false);
static META_HELD: AtomicBool = AtomicBool::new(false);

// Track phantom Ctrl/Alt (spurious KeyRelease that should have been KeyPress)
static CTRL_PHANTOM: AtomicBool = AtomicBool::new(false);
static ALT_PHANTOM: AtomicBool = AtomicBool::new(false);

#[cfg(target_os = "windows")]
static IS_ALT_GR_DOWN: AtomicBool = AtomicBool::new(false);
#[cfg(target_os = "macos")]
static IS_LEFT_OPTION_DOWN: AtomicBool = AtomicBool::new(false);

#[napi(object)]
pub struct KeyEvent {
    pub key: String,
    pub code: String,
    pub event_type: String,
    pub ctrl: bool,
    pub alt: bool,
    pub shift: bool,
    pub meta: bool,
    pub platform_code: u32,
    pub scan_code: u32,
    pub usb_hid: u32,
}

#[napi(js_name = "start_grab")]
pub fn start_grab(callback: JsFunction) -> Result<()> {
    if RUNNING.swap(true, Ordering::SeqCst) {
        return Ok(());
    }
    std::env::set_var("KEYBOARD_ONLY", "y");

    let tsfn: ThreadsafeFunction<KeyEvent, ErrorStrategy::Fatal> =
        callback.create_threadsafe_function(0, |ctx| {
            eprintln!("TSFN callback invoked in JS thread");
            Ok(vec![ctx.value])
        })?;

    thread::spawn(move || {
        KEYBOARD_HOOKED.store(true, Ordering::SeqCst);
        #[cfg(target_os = "macos")]
        set_is_main_thread(false);
        #[cfg(target_os = "windows")]
        set_event_popup(false);

        eprintln!("rdev grab thread starting");

        #[cfg(any(target_os = "windows", target_os = "macos"))]
        if let Err(err) = grab(move |event: Event| handle_event(&tsfn, event)) {
            eprintln!("rdev grab error: {:?}", err);
        }

        #[cfg(target_os = "linux")]
        {
            let _ = enable_grab();
            if let Err(err) = start_grab_listen(move |event: Event| match event.event_type {
                EventType::KeyPress(key) | EventType::KeyRelease(key) => {
                    let is_press = matches!(event.event_type, EventType::KeyPress(_));
                    update_modifiers(&key, is_press);
                    let usb_hid = rdev::code_from_key(key)
                        .map(|v| v as u32)
                        .unwrap_or(event.usb_hid as u32);
                    emit_event(
                        &tsfn,
                        &key,
                        is_press,
                        event.platform_code as u32,
                        event.position_code,
                        usb_hid,
                    );
                    None
                }
                _ => Some(event),
            }) {
                eprintln!("rdev grab error: {:?}", err);
            }
        }

        eprintln!("rdev grab thread exiting");
        KEYBOARD_HOOKED.store(false, Ordering::SeqCst);
        RUNNING.store(false, Ordering::SeqCst);
        reset_modifiers();
    });

    Ok(())
}

#[napi(js_name = "stop_grab")]
pub fn stop_grab() -> Result<()> {
    if RUNNING.swap(false, Ordering::SeqCst) {
        KEYBOARD_HOOKED.store(false, Ordering::SeqCst);
        #[cfg(any(target_os = "windows", target_os = "macos"))]
        {
            let _ = exit_grab();
        }
        #[cfg(target_os = "linux")]
        {
            let _ = exit_grab_listen();
            let _ = disable_grab();
        }
        reset_modifiers();
    }
    Ok(())
}

#[cfg(any(target_os = "windows", target_os = "macos"))]
fn handle_event(tsfn: &ThreadsafeFunction<KeyEvent, ErrorStrategy::Fatal>, event: Event) -> Option<Event> {
    // Only log keyboard events, not mouse movements
    match event.event_type {
        EventType::KeyPress(_) | EventType::KeyRelease(_) => {
            eprintln!("handle_event: {:?}", event.event_type);
        },
        _ => {}
    }

    match event.event_type {
        EventType::KeyPress(key) => {
            eprintln!("KeyPress: {:?}", key);
            try_handle_keyboard(tsfn, event, key, true)
        },
        EventType::KeyRelease(key) => {
            eprintln!("KeyRelease: {:?}", key);
            try_handle_keyboard(tsfn, event, key, false)
        },
        _ => Some(event),
    }
}

#[cfg(any(target_os = "windows", target_os = "macos"))]
fn try_handle_keyboard(
    tsfn: &ThreadsafeFunction<KeyEvent, ErrorStrategy::Fatal>,
    event: Event,
    key: Key,
    is_press: bool,
) -> Option<Event> {
    #[cfg(target_os = "windows")]
    let scan_code = event.position_code;
    #[cfg(target_os = "macos")]
    let platform_code = event.platform_code as KeyCode;

    // Fix for macOS rdev bug: Detect phantom Ctrl/Alt (spurious KeyRelease when should be KeyPress)
    if !is_press {
        match key {
            Key::ControlLeft | Key::ControlRight => {
                if !CTRL_HELD.load(Ordering::SeqCst) {
                    // Spurious KeyRelease when not held = phantom press
                    eprintln!("⚠️  Detected phantom Ctrl KeyRelease");
                    CTRL_PHANTOM.store(true, Ordering::SeqCst);
                    // Don't modify CTRL_HELD - keep it as is
                } else if CTRL_PHANTOM.load(Ordering::SeqCst) {
                    // Real KeyRelease after phantom - clear phantom
                    eprintln!("✓ Real Ctrl KeyRelease detected (clearing phantom)");
                    CTRL_PHANTOM.store(false, Ordering::SeqCst);
                }
            }
            Key::Alt | Key::AltGr => {
                if !ALT_HELD.load(Ordering::SeqCst) {
                    eprintln!("⚠️  Detected phantom Alt KeyRelease");
                    ALT_PHANTOM.store(true, Ordering::SeqCst);
                    // Don't modify ALT_HELD - keep it as is
                } else if ALT_PHANTOM.load(Ordering::SeqCst) {
                    eprintln!("✓ Real Alt KeyRelease detected (clearing phantom)");
                    ALT_PHANTOM.store(false, Ordering::SeqCst);
                }
            }
            _ => {
                // Any non-Ctrl/Alt key release clears phantoms
                CTRL_PHANTOM.store(false, Ordering::SeqCst);
                ALT_PHANTOM.store(false, Ordering::SeqCst);
            }
        }
    } else {
        // On KeyPress, clear phantoms for non-Ctrl/Alt keys
        if !matches!(key, Key::ControlLeft | Key::ControlRight | Key::Alt | Key::AltGr) {
            CTRL_PHANTOM.store(false, Ordering::SeqCst);
            ALT_PHANTOM.store(false, Ordering::SeqCst);
        }
    }

    update_modifiers(&key, is_press);
    // Use our own USB HID mapping - rdev's usb_hid values are often incorrect
    let usb_hid = key_to_usb_hid(&key);
    emit_event(
        tsfn,
        &key,
        is_press,
        event.platform_code as u32,
        event.position_code,
        usb_hid,
    );

    // Keep CapsLock/NumLock behavior intact on host OS, but still emit to JS.
    if key == Key::CapsLock || key == Key::NumLock {
        return Some(event);
    }

    #[cfg(target_os = "windows")]
    match scan_code {
        0x1D | 0x021D => rdev::set_modifier(Key::ControlLeft, is_press),
        0xE01D => rdev::set_modifier(Key::ControlRight, is_press),
        0x2A => rdev::set_modifier(Key::ShiftLeft, is_press),
        0x36 => rdev::set_modifier(Key::ShiftRight, is_press),
        0x38 => rdev::set_modifier(Key::Alt, is_press),
        0xE038 => rdev::set_modifier(Key::AltGr, is_press),
        0xE05B => rdev::set_modifier(Key::MetaLeft, is_press),
        0xE05C => rdev::set_modifier(Key::MetaRight, is_press),
        _ => {}
    }

    #[cfg(target_os = "windows")]
    if scan_code == 0x021D {
        IS_ALT_GR_DOWN.store(is_press, Ordering::SeqCst);
    }

    #[cfg(target_os = "macos")]
    if platform_code == rdev::kVK_Option {
        IS_LEFT_OPTION_DOWN.store(is_press, Ordering::SeqCst);
    }

    if KEYBOARD_HOOKED.load(Ordering::SeqCst) {
        // In control mode, block ALL key events (both press and release) from reaching the OS.
        // This prevents the host OS from processing keys while controlling the remote device.
        None
    } else {
        Some(event)
    }
}

fn emit_event(
    tsfn: &ThreadsafeFunction<KeyEvent, ErrorStrategy::Fatal>,
    key: &Key,
    is_press: bool,
    platform_code: u32,
    scan_code: u32,
    usb_hid: u32,
) {
    let (ctrl, alt, shift, meta) = current_modifiers();
    let key_str = key_to_string(key);
    let code_str = key_to_code(key);
    let event_type_str = if is_press { "down" } else { "up" }.to_string();

    eprintln!("Creating KeyEvent: type={}, key={}, code={}, usb_hid={}",
        event_type_str, key_str, code_str, usb_hid
    );

    let payload = KeyEvent {
        key: key_str,
        code: code_str,
        event_type: event_type_str,
        ctrl,
        alt,
        shift,
        meta,
        platform_code,
        scan_code,
        usb_hid,
    };

    eprintln!("Calling tsfn.call()...");
    let status = tsfn.call(payload, ThreadsafeFunctionCallMode::NonBlocking);
    eprintln!("tsfn.call() returned: {:?}", status);
}

fn update_modifiers(key: &Key, is_down: bool) {
    match key {
        Key::ControlLeft | Key::ControlRight => {
            CTRL_HELD.store(is_down, Ordering::SeqCst);
        }
        Key::Alt | Key::AltGr => {
            ALT_HELD.store(is_down, Ordering::SeqCst);
        }
        Key::ShiftLeft | Key::ShiftRight => {
            SHIFT_HELD.store(is_down, Ordering::SeqCst);
        }
        Key::MetaLeft | Key::MetaRight => {
            META_HELD.store(is_down, Ordering::SeqCst);
        }
        _ => {}
    }
}

fn current_modifiers() -> (bool, bool, bool, bool) {
    // Include phantom states for Ctrl/Alt to handle macOS rdev bug
    let ctrl = CTRL_HELD.load(Ordering::SeqCst) || CTRL_PHANTOM.load(Ordering::SeqCst);
    let alt = ALT_HELD.load(Ordering::SeqCst) || ALT_PHANTOM.load(Ordering::SeqCst);
    (
        ctrl,
        alt,
        SHIFT_HELD.load(Ordering::SeqCst),
        META_HELD.load(Ordering::SeqCst),
    )
}

fn reset_modifiers() {
    CTRL_HELD.store(false, Ordering::SeqCst);
    ALT_HELD.store(false, Ordering::SeqCst);
    SHIFT_HELD.store(false, Ordering::SeqCst);
    META_HELD.store(false, Ordering::SeqCst);
    CTRL_PHANTOM.store(false, Ordering::SeqCst);
    ALT_PHANTOM.store(false, Ordering::SeqCst);
    #[cfg(target_os = "windows")]
    IS_ALT_GR_DOWN.store(false, Ordering::SeqCst);
    #[cfg(target_os = "macos")]
    IS_LEFT_OPTION_DOWN.store(false, Ordering::SeqCst);
}

fn key_to_string(key: &Key) -> String {
    format!("{:?}", key)
}

fn key_to_usb_hid(key: &Key) -> u32 {
    // USB HID Usage IDs for Keyboard/Keypad Page (0x07)
    // Reference: https://usb.org/sites/default/files/hut1_21.pdf
    match key {
        // Letters
        Key::KeyA => 0x04,
        Key::KeyB => 0x05,
        Key::KeyC => 0x06,
        Key::KeyD => 0x07,
        Key::KeyE => 0x08,
        Key::KeyF => 0x09,
        Key::KeyG => 0x0A,
        Key::KeyH => 0x0B,
        Key::KeyI => 0x0C,
        Key::KeyJ => 0x0D,
        Key::KeyK => 0x0E,
        Key::KeyL => 0x0F,
        Key::KeyM => 0x10,
        Key::KeyN => 0x11,
        Key::KeyO => 0x12,
        Key::KeyP => 0x13,
        Key::KeyQ => 0x14,
        Key::KeyR => 0x15,
        Key::KeyS => 0x16,
        Key::KeyT => 0x17,
        Key::KeyU => 0x18,
        Key::KeyV => 0x19,
        Key::KeyW => 0x1A,
        Key::KeyX => 0x1B,
        Key::KeyY => 0x1C,
        Key::KeyZ => 0x1D,

        // Numbers
        Key::Num1 => 0x1E,
        Key::Num2 => 0x1F,
        Key::Num3 => 0x20,
        Key::Num4 => 0x21,
        Key::Num5 => 0x22,
        Key::Num6 => 0x23,
        Key::Num7 => 0x24,
        Key::Num8 => 0x25,
        Key::Num9 => 0x26,
        Key::Num0 => 0x27,

        // Special keys
        Key::Return => 0x28,
        Key::Escape => 0x29,
        Key::Backspace => 0x2A,  // This is the correct code, not 0x33!
        Key::Tab => 0x2B,
        Key::Space => 0x2C,
        Key::Minus => 0x2D,
        Key::Equal => 0x2E,
        Key::LeftBracket => 0x2F,
        Key::RightBracket => 0x30,
        Key::BackSlash => 0x31,
        Key::SemiColon => 0x33,
        Key::Quote => 0x34,
        Key::BackQuote => 0x35,  // ` and ~ key
        Key::Comma => 0x36,
        Key::Dot => 0x37,
        Key::Slash => 0x38,
        Key::CapsLock => 0x39,

        // Function keys
        Key::F1 => 0x3A,
        Key::F2 => 0x3B,
        Key::F3 => 0x3C,
        Key::F4 => 0x3D,
        Key::F5 => 0x3E,
        Key::F6 => 0x3F,
        Key::F7 => 0x40,
        Key::F8 => 0x41,
        Key::F9 => 0x42,
        Key::F10 => 0x43,
        Key::F11 => 0x44,
        Key::F12 => 0x45,

        // Navigation keys
        Key::PrintScreen => 0x46,
        Key::ScrollLock => 0x47,
        Key::Pause => 0x48,
        Key::Insert => 0x49,
        Key::Home => 0x4A,
        Key::PageUp => 0x4B,
        Key::Delete => 0x4C,
        Key::End => 0x4D,
        Key::PageDown => 0x4E,
        Key::RightArrow => 0x4F,
        Key::LeftArrow => 0x50,
        Key::DownArrow => 0x51,
        Key::UpArrow => 0x52,

        // Keypad
        Key::NumLock => 0x53,
        Key::KpDivide => 0x54,
        Key::KpMultiply => 0x55,
        Key::KpMinus => 0x56,
        Key::KpPlus => 0x57,
        Key::KpReturn => 0x58,
        Key::Kp1 => 0x59,
        Key::Kp2 => 0x5A,
        Key::Kp3 => 0x5B,
        Key::Kp4 => 0x5C,
        Key::Kp5 => 0x5D,
        Key::Kp6 => 0x5E,
        Key::Kp7 => 0x5F,
        Key::Kp8 => 0x60,
        Key::Kp9 => 0x61,
        Key::Kp0 => 0x62,
        Key::KpDecimal => 0x63,

        // Additional keys
        Key::IntlBackslash => 0x64,
        Key::F13 => 0x68,
        Key::F14 => 0x69,
        Key::F15 => 0x6A,
        Key::F16 => 0x6B,
        Key::F17 => 0x6C,
        Key::F18 => 0x6D,
        Key::F19 => 0x6E,
        Key::F20 => 0x6F,
        Key::F21 => 0x70,
        Key::F22 => 0x71,
        Key::F23 => 0x72,
        Key::F24 => 0x73,

        // Modifiers (don't send as regular keys)
        Key::ControlLeft => 0xE0,
        Key::ShiftLeft => 0xE1,
        Key::Alt => 0xE2,
        Key::MetaLeft => 0xE3,
        Key::ControlRight => 0xE4,
        Key::ShiftRight => 0xE5,
        Key::AltGr => 0xE6,
        Key::MetaRight => 0xE7,

        // Unknown key
        _ => 0x00,
    }
}

fn key_to_code(key: &Key) -> String {
    let s = match key {
        Key::Alt => "AltLeft",
        Key::AltGr => "AltRight",
        Key::Backspace => "Backspace",
        Key::CapsLock => "CapsLock",
        Key::ControlLeft => "ControlLeft",
        Key::ControlRight => "ControlRight",
        Key::MetaLeft => "MetaLeft",
        Key::MetaRight => "MetaRight",
        Key::ShiftLeft => "ShiftLeft",
        Key::ShiftRight => "ShiftRight",
        Key::Tab => "Tab",
        Key::Return => "Enter",
        Key::Escape => "Escape",
        Key::Space => "Space",
        Key::LeftArrow => "ArrowLeft",
        Key::RightArrow => "ArrowRight",
        Key::UpArrow => "ArrowUp",
        Key::DownArrow => "ArrowDown",
        Key::Home => "Home",
        Key::End => "End",
        Key::PageUp => "PageUp",
        Key::PageDown => "PageDown",
        Key::Delete => "Delete",
        Key::Insert => "Insert",
        Key::F1 => "F1",
        Key::F2 => "F2",
        Key::F3 => "F3",
        Key::F4 => "F4",
        Key::F5 => "F5",
        Key::F6 => "F6",
        Key::F7 => "F7",
        Key::F8 => "F8",
        Key::F9 => "F9",
        Key::F10 => "F10",
        Key::F11 => "F11",
        Key::F12 => "F12",
        Key::F13 => "F13",
        Key::F14 => "F14",
        Key::F15 => "F15",
        Key::F16 => "F16",
        Key::F17 => "F17",
        Key::F18 => "F18",
        Key::F19 => "F19",
        Key::F20 => "F20",
        Key::KeyA => "KeyA",
        Key::KeyB => "KeyB",
        Key::KeyC => "KeyC",
        Key::KeyD => "KeyD",
        Key::KeyE => "KeyE",
        Key::KeyF => "KeyF",
        Key::KeyG => "KeyG",
        Key::KeyH => "KeyH",
        Key::KeyI => "KeyI",
        Key::KeyJ => "KeyJ",
        Key::KeyK => "KeyK",
        Key::KeyL => "KeyL",
        Key::KeyM => "KeyM",
        Key::KeyN => "KeyN",
        Key::KeyO => "KeyO",
        Key::KeyP => "KeyP",
        Key::KeyQ => "KeyQ",
        Key::KeyR => "KeyR",
        Key::KeyS => "KeyS",
        Key::KeyT => "KeyT",
        Key::KeyU => "KeyU",
        Key::KeyV => "KeyV",
        Key::KeyW => "KeyW",
        Key::KeyX => "KeyX",
        Key::KeyY => "KeyY",
        Key::KeyZ => "KeyZ",
        Key::Num1 => "Digit1",
        Key::Num2 => "Digit2",
        Key::Num3 => "Digit3",
        Key::Num4 => "Digit4",
        Key::Num5 => "Digit5",
        Key::Num6 => "Digit6",
        Key::Num7 => "Digit7",
        Key::Num8 => "Digit8",
        Key::Num9 => "Digit9",
        Key::Num0 => "Digit0",
        Key::Minus => "Minus",
        Key::Equal => "Equal",
        Key::LeftBracket => "BracketLeft",
        Key::RightBracket => "BracketRight",
        Key::BackSlash => "Backslash",
        Key::SemiColon => "Semicolon",
        Key::Quote => "Quote",
        Key::Comma => "Comma",
        Key::Dot => "Period",
        Key::Slash => "Slash",
        Key::BackQuote => "Backquote",
        _ => return key_to_string(key),
    };
    s.to_string()
}
