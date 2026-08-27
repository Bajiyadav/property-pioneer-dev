# Flutter Mobile App Deployment Guide

This guide covers the necessary steps to take your `apps/mobile` Flutter codebase and publish it to the Google Play Store (Android) and Apple App Store (iOS).

## Phase 1: Prerequisites

Before building for release, ensure you have:

1. **Google Play Developer Account** ($25 one-time fee)
2. **Apple Developer Account** ($99/year fee) - _Required for iOS only_
3. **App Icons & Splash Screens**: Ensure your assets are correctly sized and configured in `pubspec.yaml` (using `flutter_launcher_icons` and `flutter_native_splash` if applicable).

---

## Phase 2: Android Deployment (Google Play Store)

### 1. Create a Keystore

Android requires all apps to be digitally signed before they can be installed or published.
Run this command in your terminal (macOS/Linux) to generate a Keystore:

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
```

_Keep this `.jks` file secure and never commit it to version control!_

### 2. Configure `key.properties`

Create a file at `apps/mobile/android/key.properties` with the following content:

```properties
storePassword=<password from previous step>
keyPassword=<password from previous step>
keyAlias=upload
storeFile=/Users/<your-username>/upload-keystore.jks
```

### 3. Build the Release AppBundle

Google Play requires `.aab` (AppBundle) files instead of `.apk` files because it optimizes the app size for each user's device.

```bash
cd apps/mobile
flutter build appbundle --release
```

Your release bundle will be available at: `build/app/outputs/bundle/release/app-release.aab`.

### 4. Publish to Google Play Console

1. Go to the [Google Play Console](https://play.google.com/console).
2. Create a new App.
3. Fill out the Store Listing (description, screenshots, etc.).
4. Go to **Testing > Internal Testing** or **Production**.
5. Create a new release and upload the `app-release.aab` file.
6. Submit for review!

---

## Phase 3: iOS Deployment (Apple App Store)

_Note: You must be on a Mac with Xcode installed to build and publish for iOS._

### 1. Register your Bundle ID

1. Log into your [Apple Developer Account](https://developer.apple.com/).
2. Go to **Certificates, Identifiers & Profiles** -> **Identifiers**.
3. Create a new App ID that matches the bundle identifier in your `apps/mobile/ios/Runner.xcodeproj`.

### 2. Create the App in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com/).
2. Click **My Apps** -> **+ New App**.
3. Select the Bundle ID you just registered.

### 3. Configure Signing in Xcode

1. Open the iOS project in Xcode:
   ```bash
   open apps/mobile/ios/Runner.xcworkspace
   ```
2. Click on the `Runner` target in the left sidebar.
3. Go to the **Signing & Capabilities** tab.
4. Check **"Automatically manage signing"**.
5. Select your Team (your Apple Developer account).

### 4. Build the IPA (iOS App Package)

Back in your terminal, run:

```bash
cd apps/mobile
flutter build ipa --release
```

This builds an `.xcarchive` and generates an `.ipa` file.

### 5. Upload via Transporter or Xcode

You can use the **Transporter** app (available on the Mac App Store) or Xcode's Organizer to upload the `.ipa` file to App Store Connect.
Once uploaded, go to App Store Connect, select your build, fill out your store metadata, and submit it for Apple's App Review.
