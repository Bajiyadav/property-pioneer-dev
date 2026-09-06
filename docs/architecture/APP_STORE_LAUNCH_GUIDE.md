# 📱 Seedha Properties — Mobile App Store Launch Guide

This guide walks through building, signing, and submitting the **Seedha Properties** mobile app to the **Google Play Store** (Android) and **Apple App Store** (iOS).

---

## 🤖 1. Google Play Store (Android)

Google Play requires an **Android App Bundle (`.aab`)** signed with an upload key.

### Step 1: Generate Release Upload Keystore

Run the automated keystore generator:

```bash
cd apps/mobile
./scripts/generate-keystore.sh
```

This creates:

- `android/upload-keystore.jks`: The secure 2048-bit RSA keystore.
- `android/key.properties`: Passwords and alias mapped to Gradle.

> [!CAUTION]
> **Backup `upload-keystore.jks` in a secure location!** Google Play binds your application to this keystore on your first upload. If lost, app updates cannot be published without contacting Google Support.

### Step 2: Build the Android App Bundle (`.aab`)

Run the build command:

```bash
cd apps/mobile
./scripts/build-stores.sh
```

Or directly with Flutter:

```bash
flutter build appbundle --release --no-tree-shake-icons \
  --dart-define=SUPABASE_URL=https://iyttetfaavokzyexvqam.supabase.co \
  --dart-define=SUPABASE_ANON_KEY=sb_publishable_gcIp8Q5STuoIZf-d7pJnGA_CuqPEo2x \
  --dart-define=API_BASE_URL=https://api.seedhaproperties.com
```

The output bundle will be located at:
`apps/mobile/build/app/outputs/bundle/release/app-release.aab`

### Step 3: Publish on Google Play Console

1. Open [Google Play Console](https://play.google.com/console).
2. Click **Create App**:
   - App Name: **Seedha Properties**
   - Default Language: **English (India)**
   - App or Game: **App**
   - Free or Paid: **Free**
3. Navigate to **Testing > Internal Testing** (or **Production**).
4. Create a new release and upload `app-release.aab`.
5. Fill in the Store Listing (Screenshots, Short Description, Full Description, Privacy Policy URL).
6. Submit for review!

### Automated Cloud Builds via GitHub Actions

The repository includes `.github/workflows/mobile-build.yml` which automatically builds your `.aab` on every push to `main`.
To enable automatic release signing in CI:

1. Encode your keystore: `base64 -i apps/mobile/android/upload-keystore.jks | pbcopy`
2. Add these GitHub Repository Secrets (under Settings > Secrets and variables > Actions):
   - `ANDROID_KEYSTORE_BASE64`: Output from above
   - `ANDROID_STORE_PASSWORD`: Keystore password
   - `ANDROID_KEY_PASSWORD`: Key password
   - `ANDROID_KEY_ALIAS`: `seedha-upload`

---

## 🍏 2. Apple App Store (iOS)

### Step 1: Prerequisites & Configuration

- **Bundle Identifier**: `com.seedhaproperties.seedhaPropertiesMobile`
- **Display Name**: `Seedha Properties`
- **App Permissions**: The app requires Camera, Photo Library, and Location. These are already fully configured with clear justification in [apps/mobile/ios/Runner/Info.plist](file:///Users/bajiyadav/.gemini/antigravity/scratch/property-pioneer-dev/apps/mobile/ios/Runner/Info.plist):
  - `NSCameraUsageDescription`: "Seedha Properties uses the camera so you can photograph your property listings and capture KYC/ownership documents."
  - `NSLocationWhenInUseUsageDescription`: "Seedha Properties uses your location to show properties near you and speed up city selection."
  - `NSPhotoLibraryUsageDescription`: "Seedha Properties needs access to your photos so you can attach property images and upload identity or ownership documents."

### Step 2: Configure Apple Team ID

Edit [apps/mobile/ios/ExportOptions.plist](file:///Users/bajiyadav/.gemini/antigravity/scratch/property-pioneer-dev/apps/mobile/ios/ExportOptions.plist) and update:

```xml
<key>teamID</key>
<string>YOUR_10_CHAR_APPLE_TEAM_ID</string>
```

### Step 3: Build & Archive via Xcode (Recommended)

1. Open the project in Xcode:
   ```bash
   cd apps/mobile/ios
   open Runner.xcworkspace
   ```
2. In the project settings (Runner target):
   - Select your **Signing Team**.
   - Ensure **Automatically manage signing** is checked.
3. Select **Any iOS Device (arm64)** as the target.
4. Go to **Product > Archive**.
5. Once the archive succeeds, click **Distribute App > App Store Connect > Upload**.

### Cloud iOS Builds via GitHub Actions

The repository includes `.github/workflows/mobile-ios.yml` which tests and builds the iOS runner on a macOS runner.
To sign directly in GitHub Actions, configure:

- `IOS_DIST_CERTIFICATE_BASE64`
- `IOS_PROVISIONING_PROFILE_BASE64`
- `IOS_EXPORT_OPTIONS_BASE64`
