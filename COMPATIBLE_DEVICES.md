# Compatible Devices

This document explains how to add support for new KVM devices to the electron-kvm client.

## Current Compatible Devices

| Device | VID | PID | Description |
|--------|-----|-----|-------------|
| OSRBOT / KVM Card Mini | 0x413D | 0x2107 | CH582F-based KVM devices |

## How to Add a New Device

You can add new compatible devices in two ways:

### Method 1: Edit the JavaScript file (recommended for development)

Edit `src/renderer/app.js` and add your device to the `COMPATIBLE_DEVICES` array:

```javascript
this.COMPATIBLE_DEVICES = [
    {
        vendorId: 0x413D,
        productId: 0x2107,
        description: 'KVM Control Interface (OSRBOT, KVM Card Mini, CH582F-based devices)'
    },
    // Add your device here:
    {
        vendorId: 0x1234,  // Your device's Vendor ID
        productId: 0x5678,  // Your device's Product ID
        description: 'My Custom KVM Device'
    }
];
```

### Method 2: Edit the JSON file (planned for future use)

Edit `src/compatible-devices.json` and add your device:

```json
{
  "compatibleDevices": [
    {
      "vendorId": "0x413D",
      "productId": "0x2107",
      "description": "KVM Control Interface (OSRBOT, KVM Card Mini, CH582F-based devices)"
    },
    {
      "vendorId": "0x1234",
      "productId": "0x5678",
      "description": "My Custom KVM Device"
    }
  ]
}
```

## Finding Your Device's VID/PID

### On macOS:
```bash
# List all USB HID devices with VID/PID
system_profiler SPUSBDataType | grep -A 10 "Product ID"
```

### On Linux:
```bash
lsusb
```

### On Windows:
1. Open Device Manager
2. Find your device under "Human Interface Devices"
3. Right-click → Properties → Details → Hardware IDs
4. Look for `VID_xxxx` and `PID_xxxx`

### In the electron-kvm app:
The dropdown shows devices in this format:
```
KVM Card Mini (VID:0x413d PID:0x2107)
```

## Auto-Connection Behavior

The client will automatically connect to the **first** compatible device it finds when:
1. The app starts
2. The device list is refreshed
3. A compatible device is plugged in while the app is running

If you don't want auto-connection, manually disconnect the device and it won't auto-reconnect until you manually connect again or restart the app.

## Protocol Requirements

Compatible devices must:
- Use USB HID protocol
- Have Vendor ID and Product ID that match the configured list
- Support the KVM control protocol (same as OSRBOT/KVM Card Mini)
- Implement keyboard/mouse HID endpoints

## Contributing

If you've successfully added support for a new device, please consider submitting a pull request to add it to the default compatible devices list!
