import 'dart:async';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../shared/widgets/seedha_state_view.dart';

/// Centralized Error Sanitizer for the Seedha Properties Mobile App.
/// Guarantees that users never see raw stack traces, database exceptions,
/// HTTP status codes, or technical jargon.
class SeedhaErrorHandler {
  /// Converts any exception, error, or string into a clean customer-facing message.
  static String getFriendlyMessage(dynamic error, [String? fallback]) {
    if (error == null) {
      return fallback ?? "We couldn't connect right now. Please try again.";
    }

    if (error is SocketException || error is HttpException) {
      return "Please check your internet connection and try again.";
    }

    if (error is TimeoutException) {
      return "Please try again in a moment.";
    }

    if (error is AuthException) {
      final msg = error.message.toLowerCase();
      if (msg.contains("invalid login credentials") ||
          msg.contains("invalid_grant") ||
          msg.contains("wrong password")) {
        return "Incorrect email/mobile or password. Please try again.";
      }
      if (msg.contains("otp") ||
          msg.contains("token") ||
          msg.contains("expired")) {
        return "Your OTP has expired. Please request a new OTP.";
      }
      if (msg.contains("email not confirmed") ||
          msg.contains("email_not_confirmed")) {
        return "Your email address has not been confirmed. Please check your inbox.";
      }
      if (msg.contains("already registered") ||
          msg.contains("already exists")) {
        return "An account with this email or mobile already exists. Please sign in.";
      }
      if (msg.contains("rate limit") || msg.contains("too many")) {
        return "Too many attempts. Please wait a moment and try again.";
      }
      return "Authentication error. Please try again.";
    }

    if (error is PostgrestException) {
      return fallback ?? "We couldn't connect right now. Please try again.";
    }

    if (error is PlatformException) {
      if (error.code.contains("PERMISSION") ||
          error.code.contains("DENIED") ||
          error.message?.toLowerCase().contains("permission") == true) {
        return "Permission access was denied. You can update this in your device settings.";
      }
    }

    final raw = error.toString().toLowerCase();

    if (raw.contains("socketexception") ||
        raw.contains("network") ||
        raw.contains("failed to connect") ||
        raw.contains("offline")) {
      return "Please check your internet connection and try again.";
    }

    if (raw.contains("timeout") || raw.contains("timed out")) {
      return "Please try again in a moment.";
    }

    return fallback ?? "We couldn't connect right now. Please try again.";
  }

  /// Maps any exception to the corresponding [SeedhaStateType] for full-screen or card UI.
  static SeedhaStateType getStateType(dynamic error) {
    if (error == null) return SeedhaStateType.serverError;

    if (error is SocketException || error is HttpException) {
      return SeedhaStateType.noInternet;
    }

    if (error is TimeoutException) {
      return SeedhaStateType.slowNetwork;
    }

    if (error is AuthException) {
      final msg = error.message.toLowerCase();
      if (msg.contains("jwt") ||
          msg.contains("session") ||
          msg.contains("unauthorized")) {
        return SeedhaStateType.sessionExpired;
      }
    }

    final raw = error.toString().toLowerCase();
    if (raw.contains("socketexception") ||
        raw.contains("offline") ||
        raw.contains("failed host lookup")) {
      return SeedhaStateType.noInternet;
    }

    if (raw.contains("timeout") || raw.contains("timed out")) {
      return SeedhaStateType.slowNetwork;
    }

    if (raw.contains("session") || raw.contains("jwt expired")) {
      return SeedhaStateType.sessionExpired;
    }

    return SeedhaStateType.serverError;
  }
}
