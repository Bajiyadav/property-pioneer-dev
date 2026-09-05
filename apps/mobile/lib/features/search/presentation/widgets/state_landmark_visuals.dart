import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:seedha_properties_mobile/config/constants.dart';

/// Renders a rich photographic landmark visual for Seedha's
/// authoritative operating states with smooth offline/loading fallbacks.
class StateLandmarkCard extends StatelessWidget {
  const StateLandmarkCard({
    super.key,
    required this.stateName,
    required this.cityCount,
    required this.isSelected,
    required this.onTap,
  });

  final String stateName;
  final int cityCount;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final imageUrl = AppConstants.stateLandmarkImages[stateName];
    final landmarkTitle = AppConstants.stateLandmarkTitles[stateName] ?? stateName;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 136,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
            width: isSelected ? 2.0 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? const Color(0xFF16A34A).withValues(alpha: 0.14)
                  : Colors.black.withValues(alpha: 0.04),
              blurRadius: isSelected ? 8 : 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(15),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Landmark photo block
              Expanded(
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Photo image or fallback silhouette
                    if (imageUrl != null && imageUrl.isNotEmpty)
                      imageUrl.startsWith('http')
                          ? CachedNetworkImage(
                              imageUrl: imageUrl,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => Container(
                                decoration: BoxDecoration(
                                  gradient: _getLandmarkGradient(stateName),
                                ),
                                child: CustomPaint(
                                  painter: _StateLandmarkPainter(stateName: stateName),
                                ),
                              ),
                              errorWidget: (context, url, error) => Container(
                                decoration: BoxDecoration(
                                  gradient: _getLandmarkGradient(stateName),
                                ),
                                child: CustomPaint(
                                  painter: _StateLandmarkPainter(stateName: stateName),
                                ),
                              ),
                            )
                          : Image.asset(
                              imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => Container(
                                decoration: BoxDecoration(
                                  gradient: _getLandmarkGradient(stateName),
                                ),
                                child: CustomPaint(
                                  painter: _StateLandmarkPainter(stateName: stateName),
                                ),
                              ),
                            )
                    else
                      Container(
                        decoration: BoxDecoration(
                          gradient: _getLandmarkGradient(stateName),
                        ),
                        child: CustomPaint(
                          painter: _StateLandmarkPainter(stateName: stateName),
                        ),
                      ),

                    // Contrast gradient overlay
                    Positioned.fill(
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.black.withValues(alpha: 0.25),
                              Colors.transparent,
                              Colors.black.withValues(alpha: 0.72),
                            ],
                            stops: const [0.0, 0.40, 1.0],
                          ),
                        ),
                      ),
                    ),

                    // State Code Pill
                    Positioned(
                      top: 6,
                      left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.45),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: Colors.white.withValues(alpha: 0.3),
                            width: 0.8,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.location_on_rounded, size: 10, color: Colors.white),
                            const SizedBox(width: 2),
                            Text(
                              _getStateCode(stateName),
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                color: Colors.white,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // Landmark Name Caption
                    Positioned(
                      bottom: 5,
                      left: 8,
                      right: 8,
                      child: Text(
                        landmarkTitle,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 9.5,
                          fontWeight: FontWeight.w700,
                          shadows: [
                            Shadow(
                              color: Colors.black87,
                              blurRadius: 4,
                              offset: Offset(0, 1),
                            ),
                          ],
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),

              // State info & selection indicator
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            stateName,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                              color: isSelected ? const Color(0xFF14532D) : const Color(0xFF0F172A),
                              letterSpacing: -0.2,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 2),
                          Text(
                            cityCount > 0 ? '$cityCount cities' : 'Explore cities',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Color(0xFF16A34A),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.check_rounded,
                          size: 13,
                          color: Colors.white,
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  LinearGradient _getLandmarkGradient(String state) {
    switch (state.toLowerCase()) {
      case 'telangana':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0284C7), Color(0xFF0369A1), Color(0xFF075985)],
        );
      case 'karnataka':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFD97706), Color(0xFFB45309), Color(0xFF92400E)],
        );
      case 'maharashtra':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF4F46E5), Color(0xFF4338CA), Color(0xFF3730A3)],
        );
      case 'delhi ncr':
      case 'delhi':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFE11D48), Color(0xFFBE123C), Color(0xFF9F1239)],
        );
      case 'tamil nadu':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0D9488), Color(0xFF0F766E), Color(0xFF115E59)],
        );
      case 'andhra pradesh':
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF059669), Color(0xFF047857), Color(0xFF065F46)],
        );
      default:
        return const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF3B82F6), Color(0xFF1D4ED8)],
        );
    }
  }

  String _getStateCode(String state) {
    switch (state.toLowerCase()) {
      case 'telangana':
        return 'TS';
      case 'karnataka':
        return 'KA';
      case 'maharashtra':
        return 'MH';
      case 'delhi ncr':
      case 'delhi':
        return 'DL';
      case 'tamil nadu':
        return 'TN';
      case 'andhra pradesh':
        return 'AP';
      case 'uttar pradesh':
        return 'UP';
      case 'gujarat':
        return 'GJ';
      case 'west bengal':
        return 'WB';
      default:
        return 'IN';
    }
  }
}

/// Custom painter rendering subtle architectural silhouettes for Indian heritage
class _StateLandmarkPainter extends CustomPainter {
  _StateLandmarkPainter({required this.stateName});

  final String stateName;

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    // Semi-transparent decorative glow
    final glowPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.15)
      ..style = PaintingStyle.fill;
    canvas.drawCircle(Offset(w * 0.75, h * 0.35), 24, glowPaint);

    final silhouettePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.32)
      ..style = PaintingStyle.fill;

    final basePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.22)
      ..style = PaintingStyle.fill;

    final lower = stateName.toLowerCase();

    if (lower.contains('telangana')) {
      // Charminar silhouette: minarets and central arched gateway
      final path = Path();
      // Base
      path.addRect(Rect.fromLTWH(w * 0.15, h * 0.72, w * 0.7, h * 0.28));

      // Left Minaret
      path.addRect(Rect.fromLTWH(w * 0.20, h * 0.25, 10, h * 0.5));
      path.addOval(Rect.fromLTWH(w * 0.18, h * 0.18, 14, 10));

      // Right Minaret
      path.addRect(Rect.fromLTWH(w * 0.72, h * 0.25, 10, h * 0.5));
      path.addOval(Rect.fromLTWH(w * 0.70, h * 0.18, 14, 10));

      // Center body & dome
      path.addRect(Rect.fromLTWH(w * 0.32, h * 0.40, w * 0.36, h * 0.35));
      path.addArc(Rect.fromLTWH(w * 0.38, h * 0.30, w * 0.24, 20), 3.14, 3.14);

      canvas.drawPath(path, silhouettePaint);

      // Main arch cutout
      final archPath = Path()
        ..addArc(Rect.fromLTWH(w * 0.42, h * 0.55, w * 0.16, 24), 3.14, 3.14)
        ..lineTo(w * 0.58, h)
        ..lineTo(w * 0.42, h)
        ..close();
      canvas.drawPath(archPath, basePaint);

    } else if (lower.contains('karnataka')) {
      // Mysore Palace / Vidhana Soudha classical grand facade with central dome
      final path = Path();
      path.addRect(Rect.fromLTWH(w * 0.12, h * 0.65, w * 0.76, h * 0.35));
      path.addOval(Rect.fromLTWH(w * 0.18, h * 0.42, 16, 16));
      path.addOval(Rect.fromLTWH(w * 0.66, h * 0.42, 16, 16));
      path.addOval(Rect.fromLTWH(w * 0.40, h * 0.26, 26, 26));
      path.addRect(Rect.fromLTWH(w * 0.30, h * 0.46, w * 0.40, h * 0.20));

      canvas.drawPath(path, silhouettePaint);

    } else if (lower.contains('maharashtra')) {
      // Gateway of India grand triumphal arch
      final path = Path();
      path.addRect(Rect.fromLTWH(w * 0.18, h * 0.36, 14, h * 0.64));
      path.addRect(Rect.fromLTWH(w * 0.68, h * 0.36, 14, h * 0.64));
      path.addRect(Rect.fromLTWH(w * 0.18, h * 0.28, w * 0.64, 12));

      path.addOval(Rect.fromLTWH(w * 0.44, h * 0.18, 16, 14));
      path.addRect(Rect.fromLTWH(w * 0.20, h * 0.20, 8, 10));
      path.addRect(Rect.fromLTWH(w * 0.72, h * 0.20, 8, 10));

      canvas.drawPath(path, silhouettePaint);

    } else if (lower.contains('delhi')) {
      // India Gate memorial arch silhouette
      final path = Path();
      path.addRect(Rect.fromLTWH(w * 0.24, h * 0.36, 14, h * 0.64));
      path.addRect(Rect.fromLTWH(w * 0.62, h * 0.36, 14, h * 0.64));
      path.addRect(Rect.fromLTWH(w * 0.20, h * 0.24, w * 0.60, 16));

      path.addOval(Rect.fromLTWH(w * 0.44, h * 0.18, 16, 8));

      canvas.drawPath(path, silhouettePaint);

    } else if (lower.contains('tamil nadu')) {
      // Dravidian Temple Gopuram tiered stepped pyramid
      final path = Path();
      path.addRect(Rect.fromLTWH(w * 0.22, h * 0.70, w * 0.56, 14));
      path.addRect(Rect.fromLTWH(w * 0.26, h * 0.58, w * 0.48, 14));
      path.addRect(Rect.fromLTWH(w * 0.30, h * 0.46, w * 0.40, 14));
      path.addRect(Rect.fromLTWH(w * 0.35, h * 0.34, w * 0.30, 14));
      path.addOval(Rect.fromLTWH(w * 0.42, h * 0.22, 18, 14));

      canvas.drawPath(path, silhouettePaint);

    } else {
      // Coastal lighthouse & heritage arch for Andhra Pradesh / fallback
      final path = Path();
      path.addRect(Rect.fromLTWH(w * 0.20, h * 0.72, w * 0.60, h * 0.28));
      path.addRect(Rect.fromLTWH(w * 0.42, h * 0.30, 18, h * 0.45));
      path.addOval(Rect.fromLTWH(w * 0.39, h * 0.20, 24, 16));

      canvas.drawPath(path, silhouettePaint);
    }
  }

  @override
  bool shouldRepaint(covariant _StateLandmarkPainter oldDelegate) {
    return oldDelegate.stateName != stateName;
  }
}
