# Linux HID Device Setup

This document explains how to set up HID device permissions on Linux systems for the KVM Client.

## Automatic Setup (Recommended)

### For .deb package users:
The .deb package will automatically set up HID permissions during installation.

### For AppImage users:
1. Extract the post-install script from the app directory
2. Run: `./post-install.sh`

## Manual Setup

If automatic setup doesn't work, follow these steps:

### 1. Install udev rules
```bash
sudo cp 99-hidraw-permissions.rules /etc/udev/rules.d/
sudo chmod 644 /etc/udev/rules.d/99-hidraw-permissions.rules
```

### 2. Add user to plugdev group
```bash
sudo usermod -a -G plugdev $USER
```

### 3. Reload udev rules
```bash
sudo udevadm control --reload-rules
sudo udevadm trigger
```

### 4. Log out and log back in
This is required for group membership changes to take effect.

## Troubleshooting

### Permission Denied Errors
1. **Check group membership**: `groups $USER`
   - You should see `plugdev` in the output
   - If not, run: `sudo usermod -a -G plugdev $USER`

2. **Check udev rules**: `ls -la /etc/udev/rules.d/99-hidraw-permissions.rules`
   - File should exist and be readable

3. **Check HID device permissions**: `ls -la /dev/hidraw*`
   - Devices should be accessible to plugdev group

4. **Log out and log back in** - This is crucial for group changes to take effect

5. **Reload udev rules manually**:
   ```bash
   sudo udevadm control --reload-rules
   sudo udevadm trigger
   ```

6. **Set permissions manually** (if needed):
   ```bash
   sudo chmod 666 /dev/hidraw*
   sudo chgrp plugdev /dev/hidraw*
   ```

### After .deb Installation
The post-install script should run automatically, but if it doesn't:
```bash
sudo /opt/KVM\ Client/resources/post-install.sh
```

### Alternative: Run with sudo
As a temporary workaround, you can run the application with sudo:
```bash
sudo ./KVM-Client.AppImage
```

Note: Running with sudo is not recommended for security reasons and should only be used for testing.

## Dependencies
The application requires:
- libusb-1.0-0
- libudev1
- HID kernel modules

Install on Ubuntu/Debian:
```bash
sudo apt-get install libusb-1.0-0-dev libudev-dev
```

### Ubuntu 20.04 Specific Issues

#### GLIBC Compatibility Issue
Ubuntu 20.04 has an older GLIBC version that may cause the error:
```
Error: /lib/x86_64-linux-gnu/libc.so.6: version `GLIBC_2.33' not found
```

**Solution**: Use the .deb package which rebuilds native modules for compatibility, or manually rebuild:
```bash
# If using AppImage fails, try the .deb package instead
sudo dpkg -i electron-kvm-client_1.0.0_amd64.deb
```

#### HID Modules (if needed)
On Ubuntu 20.04, you may need to manually load HID modules:
```bash
sudo modprobe hid
sudo modprobe hid-generic
```

To make HID modules load automatically at boot, add them to `/etc/modules`:
```bash
echo "hid" | sudo tee -a /etc/modules
echo "hid-generic" | sudo tee -a /etc/modules
```