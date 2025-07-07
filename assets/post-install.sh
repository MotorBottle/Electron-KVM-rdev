#!/bin/bash

# Post-install script for Linux HID device permissions
# This script sets up udev rules for HID device access

RULES_FILE="/etc/udev/rules.d/99-hidraw-permissions.rules"
TEMP_RULES="/tmp/99-hidraw-permissions.rules"

echo "Setting up HID device permissions..."

# Copy the rules file to the temporary location
cp "$(dirname "$0")/99-hidraw-permissions.rules" "$TEMP_RULES"

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

# Add user to plugdev group if not already a member
if ! groups "$USER" | grep -q "plugdev"; then
    echo "Adding user to plugdev group..."
    if [ "$EUID" -eq 0 ]; then
        usermod -a -G plugdev "$SUDO_USER"
    else
        if command -v sudo >/dev/null 2>&1; then
            sudo usermod -a -G plugdev "$USER"
        else
            echo "WARNING: Unable to add user to plugdev group automatically."
            echo "Please run: sudo usermod -a -G plugdev $USER"
        fi
    fi
    echo "Please log out and log back in for group changes to take effect."
fi

# Clean up
rm -f "$TEMP_RULES"
echo "Setup complete."