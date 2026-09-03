import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:seedha_properties_mobile/features/owner/presentation/kyc_upload_screen.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/wizard/listing_wizard_screen.dart';
import 'package:seedha_properties_mobile/features/properties/providers/listing_wizard_provider.dart';
import 'package:seedha_properties_mobile/features/properties/services/property_upload_service.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/auth_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final _mockSupabaseClient = SupabaseClient(
  'https://mock.supabase.co',
  'mock-anon-key',
  authOptions: const AuthClientOptions(autoRefreshToken: false),
);

class FakeAuthService extends AuthService {
  final User? mockUser;
  FakeAuthService(this.mockUser) : super(_mockSupabaseClient);

  @override
  User? get currentUser => mockUser;

  @override
  Stream<AuthState> get authStateChanges => const Stream.empty();
}

class FakeImagePicker extends Fake implements ImagePicker {
  final List<String> galleryPaths;
  final String? cameraPath;

  FakeImagePicker({this.galleryPaths = const [], this.cameraPath});

  @override
  Future<List<XFile>> pickMultiImage({
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    int? limit,
    bool requestFullMetadata = true,
  }) async {
    return galleryPaths.map((p) => XFile(p)).toList();
  }

  @override
  Future<XFile?> pickImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    CameraDevice preferredCameraDevice = CameraDevice.rear,
    bool requestFullMetadata = true,
  }) async {
    if (source == ImageSource.camera && cameraPath != null) {
      return XFile(cameraPath!);
    }
    if (source == ImageSource.gallery && galleryPaths.isNotEmpty) {
      return XFile(galleryPaths.first);
    }
    return null;
  }
}

void main() {
  group('PropertyUploadService & Listing Validation Tests', () {
    test('validateImage accepts valid extensions within 10MB limit', () {
      final service = PropertyUploadService(client: _mockSupabaseClient);

      final validJpg = File('test_property.jpg');
      expect(service.validateImage(validJpg, 5 * 1024 * 1024), isNull);

      final validPng = File('test_property.png');
      expect(service.validateImage(validPng, 2 * 1024 * 1024), isNull);

      final validWebp = File('test_property.webp');
      expect(service.validateImage(validWebp, 1 * 1024 * 1024), isNull);
    });

    test('validateImage rejects executable and unsupported extensions', () {
      final service = PropertyUploadService(client: _mockSupabaseClient);

      final exeFile = File('malicious_script.exe');
      expect(
        service.validateImage(exeFile, 1024),
        contains('Unsupported format (.exe)'),
      );

      final shFile = File('deploy.sh');
      expect(
        service.validateImage(shFile, 1024),
        contains('Unsupported format (.sh)'),
      );
    });

    test('validateImage rejects oversized photos (>10MB) and empty files', () {
      final service = PropertyUploadService(client: _mockSupabaseClient);

      final bigFile = File('huge_photo.jpg');
      expect(
        service.validateImage(bigFile, 12 * 1024 * 1024),
        contains('The limit is 10MB'),
      );

      final emptyFile = File('zero.jpg');
      expect(
        service.validateImage(emptyFile, 0),
        contains('This file is empty'),
      );
    });

    test('ListingFormData requires bedrooms for residential and waives bedrooms for commercial', () {
      const residentialData = ListingFormData(
        propertyType: 'Apartment',
        bedrooms: null,
      );
      expect(residentialData.isCommercial, isFalse);
      expect(residentialData.validate().containsKey('bedrooms'), isTrue);

      const commercialData = ListingFormData(
        propertyType: 'Office Space',
        bedrooms: null,
      );
      expect(commercialData.isCommercial, isTrue);
      expect(commercialData.validate().containsKey('bedrooms'), isFalse);
    });

    test('Camera capture integration in PropertyUploadService returns image path', () async {
      final fakePicker = FakeImagePicker(cameraPath: '/mock/camera_photo.jpg');
      final service = PropertyUploadService(
        client: _mockSupabaseClient,
        picker: fakePicker,
      );

      final result = await service.captureImageFromCamera();
      expect(result, '/mock/camera_photo.jpg');
    });
  });

  group('ListingWizardScreen & KYC Widget Tests', () {
    testWidgets('ListingWizard renders location step and step progression indicator', (tester) async {
      await tester.pumpWidget(
        const ProviderScope(
          child: MaterialApp(
            home: ListingWizardScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('List Your Property'), findsOneWidget);
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
    });

    testWidgets('KYCUploadScreen renders document type selection chips and encryption banner', (tester) async {
      final fakeAuth = FakeAuthService(
        const User(
          id: 'owner-789',
          appMetadata: {},
          userMetadata: {},
          aud: 'authenticated',
          createdAt: '2026-01-01',
        ),
      );

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authServiceProvider.overrideWithValue(fakeAuth),
          ],
          child: MaterialApp(
            home: KYCUploadScreen(client: _mockSupabaseClient),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Owner KYC Verification'), findsOneWidget);
      expect(find.text('Aadhaar Card'), findsOneWidget);
      expect(find.text('PAN Card'), findsOneWidget);
      expect(find.text('Electricity Bill'), findsOneWidget);
      expect(find.text('Property Tax'), findsOneWidget);
      expect(find.text('Encrypted securely in private storage'), findsOneWidget);
    });
  });
}
