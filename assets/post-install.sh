#!/bin/bash

# Post-install script for Linux HID device permissions
# This script sets up udev rules for HID device access

RULES_FILE="/etc/udev/rules.d/99-hidraw-permissions.rules"
TEMP_RULES="/tmp/99-hidraw-permissions.rules"

echo "Setting up HID device permissions..."

# Check if HID modules are loaded and load them if needed
if ! lsmod | grep -q "hid"; then
    echo "Loading HID kernel modules..."
    if [ "$EUID" -eq 0 ]; then
        modprobe hid 2>/dev/null || echo "WARNING: Could not load HID module"
        modprobe hid-generic 2>/dev/null || echo "WARNING: Could not load HID generic module"
    else
        if command -v sudo >/dev/null 2>&1; then
            sudo modprobe hid 2>/dev/null || echo "WARNING: Could not load HID module"
            sudo modprobe hid-generic 2>/dev/null || echo "WARNING: Could not load HID generic module"
        else
            echo "WARNING: Unable to load HID modules. Please run:"
            echo "sudo modprobe hid"
            echo "sudo modprobe hid-generic"
        fi
    fi
fi

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RULES_SOURCE="$SCRIPT_DIR/99-hidraw-permissions.rules"

# Check if the rules file exists in the script directory
if [ ! -f "$RULES_SOURCE" ]; then
    echo "WARNING: Could not find udev rules file at $RULES_SOURCE"
    echo "Trying alternative locations..."
    
    # Try to find the rules file in common locations
    if [ -f "/opt/KVM Client/resources/99-hidraw-permissions.rules" ]; then
        RULES_SOURCE="/opt/KVM Client/resources/99-hidraw-permissions.rules"
    elif [ -f "/usr/share/kvm-client/99-hidraw-permissions.rules" ]; then
        RULES_SOURCE="/usr/share/kvm-client/99-hidraw-permissions.rules"
    else
        echo "ERROR: Could not find udev rules file."
        echo "Please manually create the rules file with the following content:"
        cat << 'EOF'
# udev rules for HID device access
SUBSYSTEM=="usb", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="hidraw", MODE="0666", GROUP="plugdev"
KERNEL=="hidraw*", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="hidraw", ATTRS{idVendor}=="*", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTRS{idVendor}=="*", ATTRS{idProduct}=="*", MODE="0666", GROUP="plugdev"
ACTION=="add", KERNEL=="hidraw*", MODE="0666", GROUP="plugdev"
EOF
        exit 1
    fi
fi

# Copy the rules file to the temporary location
cp "$RULES_SOURCE" "$TEMP_RULES"

# Check if running as root or with sudo
if [ "$EUID" -eq 0 ]; then
    # Running as root, install directly
    cp "$TEMP_RULES" "$RULES_FILE"
    chmod 644 "$RULES_FILE"
    udevadm control --reload-rules
    udevadm trigger
    echo "HID device permissions configured successfully."
else
    # Not running as root, check if sudo is available
    if command -v sudo >/dev/null 2>&1; then
        echo "Installing udev rules (requires sudo)..."
        sudo cp "$TEMP_RULES" "$RULES_FILE"
        sudo chmod 644 "$RULES_FILE"
        sudo udevadm control --reload-rules
        sudo udevadm trigger
        echo "HID device permissions configured successfully."
    else
        echo "WARNING: Unable to install udev rules automatically."
        echo "Please run the following commands manually:"
        echo "sudo cp '$TEMP_RULES' '$RULES_FILE'"
        echo "sudo chmod 644 '$RULES_FILE'"
        echo "sudo udevadm control --reload-rules"
        echo "sudo udevadm trigger"
    fi
fi

# Get the actual user (not root when using sudo)
ACTUAL_USER="${SUDO_USER:-$USER}"

# Add user to plugdev group if not already a member
if ! groups "$ACTUAL_USER" | grep -q "plugdev"; then
    echo "Adding user $ACTUAL_USER to plugdev group..."
    if [ "$EUID" -eq 0 ]; then
        usermod -a -G plugdev "$ACTUAL_USER"
    else
        if command -v sudo >/dev/null 2>&1; then
            sudo usermod -a -G plugdev "$ACTUAL_USER"
        else
            echo "WARNING: Unable to add user to plugdev group automatically."
            echo "Please run: sudo usermod -a -G plugdev $ACTUAL_USER"
        fi
    fi
    echo "Please log out and log back in for group changes to take effect."
fi

# Set permissions on existing hidraw devices
echo "Setting permissions on existing HID devices..."
for device in /dev/hidraw*; do
    if [ -e "$device" ]; then
        if [ "$EUID" -eq 0 ]; then
            chmod 666 "$device"
            chgrp plugdev "$device"
        else
            if command -v sudo >/dev/null 2>&1; then
                sudo chmod 666 "$device"
                sudo chgrp plugdev "$device"
            fi
        fi
    fi
done

# Clean up
rm -f "$TEMP_RULES"
echo "Setup complete."
echo ""
echo "IMPORTANT: Please log out and log back in for group membership changes to take effect."
echo "If you still have issues, try running the application after logging back in."