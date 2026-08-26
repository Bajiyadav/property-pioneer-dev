import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../config/constants.dart';
import '../../../config/theme.dart';
import '../../../models/employee_access.dart';
import '../../../providers/app_providers.dart';

/// How long the brand stays on screen at minimum.
///
/// Short enough not to feel like a delay, long enough that a fast session
/// restore does not flash the logo for a single frame.
const Duration _kMinimumHold = Duration(milliseconds: 900);

/// Hard ceiling on resolving the destination. If the staff lookup is slow we
/// stop waiting and send the user to Home rather than holding the splash — a
/// launch screen must never be the thing that hangs.
const Duration _kResolveCeiling = Duration(seconds: 6);

/// Launch screen. Resolves the session and routes to the right place.
///
/// Everyone lands on Home unless their role genuinely requires somewhere else:
/// browsing is the default experience, and an owner still starts on Home and
/// chooses to open their dashboard. Only staff are routed away, because the
/// consoles are the whole reason those accounts exist.
class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen> {
  @override
  void initState() {
    super.initState();
    // Deferred so the first frame paints before any async work begins.
    WidgetsBinding.instance.addPostFrameCallback((_) => _resolveDestination());
  }

  Future<void> _resolveDestination() async {
    final held = Future<void>.delayed(_kMinimumHold);

    String destination = '/';
    try {
      destination = await _destinationForCurrentUser().timeout(_kResolveCeiling);
    } catch (_) {
      // Session or staff lookup failed. Home is the correct fallback: it is the
      // least-privileged destination and works signed out, so a network blip
      // can never strand someone on a launch screen or, worse, drop them into a
      // console their role was never confirmed for.
      destination = '/';
    }

    await held;
    if (!mounted) return;
    context.go(destination);
  }

  Future<String> _destinationForCurrentUser() async {
    final auth = ref.read(authServiceProvider);
    if (auth.currentUser == null) return '/';

    // Staff grants live in `employee_access`, separate from `user_roles`. A
    // customer or owner has no row here and goes to Home like anyone else.
    final access = await auth.getEmployeeAccess();
    if (access == null) return '/';

    return access.role.isAdmin ? '/admin-dashboard' : '/staff-dashboard';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: DecoratedBox(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF115E59), AppTheme.primaryColor, Color(0xFF047857)],
          ),
        ),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Architectural silhouette. Drawn rather than photographed: there is
            // no licensed property image in the bundle, and a stock house would
            // imply a listing that does not exist.
            const Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              height: 220,
              child: _SkylineSilhouette(),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Column(
                  children: [
                    const Spacer(flex: 3),
                    _brandMark(),
                    const SizedBox(height: 26),
                    const Text(
                      'SEEDHA',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 40,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 6,
                        height: 1.0,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'PROPERTIES',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xFF99F6E4),
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        letterSpacing: 7,
                      ),
                    ),
                    const SizedBox(height: 22),
                    _brokeragePill(),
                    const SizedBox(height: 14),
                    const Text(
                      'Direct from Owners',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.2,
                      ),
                    ),
                    const Spacer(flex: 4),
                    const SizedBox(
                      width: 132,
                      child: LinearProgressIndicator(
                        minHeight: 3,
                        backgroundColor: Color(0x33FFFFFF),
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    ),
                    const SizedBox(height: 26),
                    const Text(
                      AppConstants.appTagline,
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Color(0xCCFFFFFF),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _brandMark() {
    return Container(
      width: 96,
      height: 96,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(26),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.22),
            blurRadius: 26,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Image.asset(
          'assets/logo.png',
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => const Center(
            child: Icon(Icons.home_work_rounded,
                size: 46, color: AppTheme.primaryColor),
          ),
        ),
      ),
    );
  }

  Widget _brokeragePill() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.16),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: Colors.white.withValues(alpha: 0.34)),
      ),
      child: const Text(
        '0% BROKERAGE',
        style: TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w900,
          letterSpacing: 1.4,
        ),
      ),
    );
  }
}

/// A quiet skyline along the bottom edge, in two depths so it reads as distance
/// rather than a flat band.
class _SkylineSilhouette extends StatelessWidget {
  const _SkylineSilhouette();

  @override
  Widget build(BuildContext context) {
    return CustomPaint(painter: _SkylinePainter());
  }
}

class _SkylinePainter extends CustomPainter {
  // Each tower is (left fraction, width fraction, height fraction of the band).
  static const List<List<double>> _back = [
    [0.02, 0.10, 0.42], [0.14, 0.07, 0.62], [0.23, 0.11, 0.34],
    [0.36, 0.08, 0.72], [0.46, 0.10, 0.48], [0.58, 0.07, 0.66],
    [0.67, 0.12, 0.38], [0.81, 0.09, 0.58], [0.92, 0.08, 0.44],
  ];
  static const List<List<double>> _front = [
    [0.00, 0.13, 0.26], [0.16, 0.10, 0.40], [0.29, 0.14, 0.22],
    [0.45, 0.11, 0.36], [0.59, 0.13, 0.25], [0.74, 0.10, 0.42],
    [0.87, 0.13, 0.30],
  ];

  void _paintBand(Canvas canvas, Size size, List<List<double>> towers, Paint paint) {
    for (final t in towers) {
      final left = t[0] * size.width;
      final width = t[1] * size.width;
      final height = t[2] * size.height;
      canvas.drawRRect(
        RRect.fromRectAndCorners(
          Rect.fromLTWH(left, size.height - height, width, height),
          topLeft: const Radius.circular(3),
          topRight: const Radius.circular(3),
        ),
        paint,
      );
    }
  }

  @override
  void paint(Canvas canvas, Size size) {
    _paintBand(canvas, size, _back, Paint()..color = const Color(0x1AFFFFFF));
    _paintBand(canvas, size, _front, Paint()..color = const Color(0x26FFFFFF));
  }

  @override
  bool shouldRepaint(covariant _SkylinePainter oldDelegate) => false;
}
