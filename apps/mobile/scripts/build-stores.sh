#!/usr/bin/env bash
# ==============================================================================
# Seedha Properties - Mobile App Store Production Build Script
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MOBILE_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$MOBILE_DIR"

echo "=================================================="
echo "📦 SEEDHA PROPERTIES - APP STORE PRODUCTION BUILD"
echo "=================================================="

# 1. Check Flutter & Dependencies
echo "--> 1/4 Verifying Flutter environment & dependencies..."
flutter pub get

# 2. Run Test Suite
echo "--> 2/4 Running mobile automated test suite..."
flutter test

# 3. Build Android App Bundle (.aab)
echo "--> 3/4 Building Android Release App Bundle (.aab)..."
if [ ! -f "android/key.properties" ]; then
    echo "⚠️  android/key.properties not found!"
    echo "    To generate your upload keystore, run: ./scripts/generate-keystore.sh"
    echo "    Proceeding with local build..."
fi

flutter build appbundle --release --no-tree-shake-icons \
    --dart-define=SUPABASE_URL=https://iyttetfaavokzyexvqam.supabase.co \
    --dart-define=SUPABASE_ANON_KEY=sb_publishable_gcIp8Q5STuoIZf-d7pJnGA_CuqPEo2x \
    --dart-define=API_BASE_URL=https://seedhaproperties.com/api

AAB_OUTPUT="build/app/outputs/bundle/release/app-release.aab"
if [ -f "$AAB_OUTPUT" ]; then
    echo "✅ Android App Bundle ready: $MOBILE_DIR/$AAB_OUTPUT"
    echo "   File size: $(ls -lh "$AAB_OUTPUT" | awk '{print $5}')"
fi

# 4. Build iOS (if macOS & Xcode available)
echo "--> 4/4 Checking iOS build prerequisites..."
if [[ "$OSTYPE" == "darwin"* ]] && command -v xcodebuild &>/dev/null; then
    echo "Building iOS release archive..."
    EXPORT_PLIST="config/ExportOptions.plist"
    if [ -f "ios/ExportOptions.plist" ]; then
        EXPORT_PLIST="ios/ExportOptions.plist"
    fi
    flutter build ipa --release \
        --export-options-plist="$EXPORT_PLIST" \
        --dart-define=SUPABASE_URL=https://iyttetfaavokzyexvqam.supabase.co \
        --dart-define=SUPABASE_ANON_KEY=sb_publishable_gcIp8Q5STuoIZf-d7pJnGA_CuqPEo2x \
        --dart-define=API_BASE_URL=https://seedhaproperties.com/api || {
        echo "⚠️ iOS IPA export requires configured Apple Team ID in ios/ExportOptions.plist."
        echo "   You can build Runner.xcworkspace directly in Xcode once your Apple Developer Account is linked."
    }
else
    echo "ℹ️  iOS builds require macOS with full Xcode installed or GitHub Actions (mobile-ios.yml)."
fi

echo "=================================================="
echo "🎉 Build process finished!"
echo "Android Play Store: Upload $AAB_OUTPUT to Google Play Console"
echo "Apple App Store:    Distribute via Xcode Organizer or GitHub Actions (mobile-ios.yml)"
echo "=================================================="
