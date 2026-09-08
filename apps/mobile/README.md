# 📱 Seedha Properties Mobile App

[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-3.2+-0175C2?style=for-the-badge&logo=dart&logoColor=white)](https://dart.dev/)
[![Riverpod](https://img.shields.io/badge/State-Riverpod_2.5-blue?style=for-the-badge)](https://riverpod.dev/)
[![Platform](https://img.shields.io/badge/Platform-iOS_%7C_Android-black?style=for-the-badge)](https://flutter.dev/)
[![Tests](https://img.shields.io/badge/Unit_%26_Widget_Tests-170+_Passed-brightgreen?style=for-the-badge)](test/)

> **The official cross-platform mobile application for Seedha Properties — India's 0% brokerage, direct-owner real estate marketplace.**

---

## 🌟 Key Capabilities & Architectural Invariants

1. **Mandatory Location-First UX Discovery**:
   - Strictly enforces the journey: `State ➔ City ➔ Confirmed Locality ➔ Location-Gated Listings`.
   - Buy, Rent, and Commercial listing feeds remain strictly scoped to confirmed locations.
2. **Privacy-Preserving Geospatial Maps**:
   - Interactive maps powered by `flutter_map` and OpenStreetMap (`latlong2`).
   - Exact coordinates are never exposed; displays ~110m privacy-jittered circles (`approx_latitude`, `approx_longitude`).
3. **Owner-Direct Engagement**:
   - In-app direct owner contact unlock passes, encrypted visit scheduling, and WhatsApp/phone routing via `url_launcher`.
4. **Resilient Offline Architecture**:
   - Local token storage with `flutter_secure_storage` and state caching with `shared_preferences`.
   - Comprehensive error reporting and performance tracing via `sentry_flutter`.

---

## 🏗️ Architecture & Project Structure

```
apps/mobile/
├── android/               # Native Android project (Gradle, AndroidManifest, ProGuard)
├── ios/                   # Native iOS project (Xcode, Podfile, Runner)
├── assets/                # App icons, splash screens, state badges & media
├── lib/
│   ├── main.dart          # App entrypoint & Sentry initialization
│   ├── app.dart           # MaterialApp.router configuration & theme setup
│   ├── config/            # API endpoints, environment configs & constants
│   ├── routing/           # Declarative routing with go_router (Deep linking)
│   ├── providers/         # Riverpod state notifiers & repository providers
│   ├── models/            # Type-safe data models with JSON serialization
│   ├── services/          # REST HTTP client (/api/v2/*) & storage services
│   ├── views/             # Responsive screens (Location, Feed, Details, Auth)
│   └── widgets/           # Atomic UI components & custom cards
└── test/                  # Component, unit, and mock test suites (170+ tests)
```

---

## 🚀 Getting Started

### Prerequisites

- [Flutter SDK](https://docs.flutter.dev/get-started/install) (`>= 3.2.0`)
- [Dart SDK](https://dart.dev/get-dart) (`>= 3.2.0`)
- Android Studio / Xcode for device emulators

### Installation

```bash
# 1. Navigate to the mobile directory
cd apps/mobile

# 2. Fetch Flutter package dependencies
flutter pub get

# 3. Verify Flutter environment health
flutter doctor
```

### Running the App

```bash
# Run on connected emulator or physical device (debug mode)
flutter run

# Run with environment-specific API target
flutter run --dart-define=API_URL=https://api.seedhaproperties.com
```

---

## 🧪 Testing & Code Quality

```bash
# Run full automated test suite
flutter test

# Run static analysis
flutter analyze

# Collect code coverage
flutter test --coverage
```

---

## 📦 Production Builds

### Android Release (.aab for Google Play)

```bash
flutter build appbundle --release
```

_Output: `build/app/outputs/bundle/release/app-release.aab`_

### iOS Release (.ipa for Apple App Store)

```bash
flutter build ipa --release
```

_Output: `build/ios/archive/Runner.xcarchive`_

---

## 🔐 Security & Network Hygiene

- Zero secret keys in client source code.
- Strict HTTPS validation with TLS 1.3.
- Device keychain storage via `flutter_secure_storage`.
- In-flight request cancellation and token refresh interceptors.
