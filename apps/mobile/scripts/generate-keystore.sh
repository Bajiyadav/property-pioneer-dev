#!/usr/bin/env bash
# ==============================================================================
# Seedha Properties - Automated Android Upload Keystore Generator
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$MOBILE_DIR/android"
KEYSTORE_PATH="$ANDROID_DIR/upload-keystore.jks"
KEY_PROPERTIES="$ANDROID_DIR/key.properties"

echo "=================================================="
echo "🔐 Seedha Properties - Android Release Key Generator"
echo "=================================================="

if [ -f "$KEYSTORE_PATH" ]; then
    echo "⚠️ Keystore already exists at: $KEYSTORE_PATH"
    read -p "Do you want to overwrite it? (y/N): " CONFIRM
    if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
        echo "Aborting keystore generation."
        exit 0
    fi
fi

# Generate strong random password if none provided
KEYSTORE_PASS=$(openssl rand -base64 18 | tr -dc 'a-zA-Z0-9' | head -c 16)
KEY_PASS="$KEYSTORE_PASS"
ALIAS="seedha-upload"

echo "Generating 2048-bit RSA upload keystore..."
keytool -genkeypair \
    -v \
    -keystore "$KEYSTORE_PATH" \
    -alias "$ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$KEYSTORE_PASS" \
    -keypass "$KEY_PASS" \
    -dname "CN=Seedha Properties, OU=Engineering, O=Seedha Properties Private Limited, L=Hyderabad, ST=Telangana, C=IN"

echo "Writing $KEY_PROPERTIES..."
cat <<EOF > "$KEY_PROPERTIES"
storePassword=$KEYSTORE_PASS
keyPassword=$KEY_PASS
keyAlias=$ALIAS
storeFile=upload-keystore.jks
EOF

chmod 600 "$KEYSTORE_PATH" "$KEY_PROPERTIES"

echo "=================================================="
echo "✅ Keystore generated successfully!"
echo "Keystore Path:   $KEYSTORE_PATH"
echo "Properties Path: $KEY_PROPERTIES"
echo "Key Alias:       $ALIAS"
echo "Password:        $KEYSTORE_PASS"
echo "⚠️  IMPORTANT: Back up upload-keystore.jks securely! Google Play requires this key for all future app updates."
echo "=================================================="
