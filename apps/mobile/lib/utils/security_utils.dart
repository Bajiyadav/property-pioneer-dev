import 'dart:convert';
import 'package:crypto/crypto.dart';

class SecurityUtils {
  /// Hash text with SHA-256 for non-sensitive checksums/fingerprinting
  static String hashText(String text) {
    return sha256.convert(utf8.encode(text)).toString();
  }

  /// Validate standard email formatting
  static bool isValidEmail(String email) {
    return RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(email.trim());
  }

  /// Validate strong password criteria (min 8 characters, numbers/special characters)
  static bool isStrongPassword(String password) {
    return password.length >= 8 &&
        RegExp(r'[A-Za-z]').hasMatch(password) &&
        RegExp(r'[0-9]').hasMatch(password);
  }

  /// Sanitize user input to prevent unwanted character injection
  static String sanitizeInput(String input, {int maxLength = 1000}) {
    final cleaned = input.trim().replaceAll(RegExp(r'[<>{}]'), '');
    return cleaned.length > maxLength ? cleaned.substring(0, maxLength) : cleaned;
  }
}
