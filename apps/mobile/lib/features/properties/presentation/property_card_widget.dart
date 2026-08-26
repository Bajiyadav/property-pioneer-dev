import 'package:flutter/material.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/shared/widgets/property_watermark_widget.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// One spec item on a property card. Kept small and self-sizing so a [Wrap]
/// can reflow the set on a narrow screen.
Widget _specChip(IconData icon, String label) {
  return Row(
    mainAxisSize: MainAxisSize.min,
    children: [
      Icon(icon, size: 15, color: const Color(0xFF475569)),
      const SizedBox(width: 3),
      Text(
        label,
        style: const TextStyle(
            fontSize: 11, fontWeight: FontWeight.w700, color: Color(0xFF334155)),
      ),
    ],
  );
}

class PropertyCardWidget extends StatelessWidget {
  final Property property;
  final VoidCallback onTap;
  final bool isFavorite;
  final VoidCallback? onToggleFavorite;

  const PropertyCardWidget({
    super.key,
    required this.property,
    required this.onTap,
    this.isFavorite = false,
    this.onToggleFavorite,
  });

  @override
  Widget build(BuildContext context) {
    // A listing with no photos shows a neutral placeholder, not a stock photo
    // of an unrelated house. Substituting one made a photo-less listing
    // indistinguishable from a photographed one to the buyer scrolling past it.
    final String? coverImage =
        property.images.isNotEmpty ? property.images.first : null;

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 620),
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.05),
                  blurRadius: 12,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image with Watermark, Gradient and Badges
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                  child: Stack(
                    children: [
                      SizedBox(
                        height: 185,
                        width: double.infinity,
                        child: coverImage == null
                            ? Container(
                                color: Colors.grey.shade100,
                                child: const Center(
                                  child: Icon(Icons.home_work_outlined,
                                      size: 44, color: Colors.grey),
                                ),
                              )
                            : CachedNetworkImage(
                                imageUrl: coverImage,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Container(
                                  color: Colors.grey.shade100,
                                  child: const Center(
                                    child: CircularProgressIndicator(),
                                  ),
                                ),
                                errorWidget: (context, url, error) => Container(
                                  color: Colors.grey.shade100,
                                  child: const Center(
                                    child: Icon(Icons.home_work_outlined,
                                        size: 44, color: Colors.grey),
                                  ),
                                ),
                              ),
                      ),

                      // Gradient overlay for better badge/text contrast
                      Positioned.fill(
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.35),
                                Colors.transparent,
                                Colors.black.withValues(alpha: 0.15),
                              ],
                              stops: const [0.0, 0.4, 1.0],
                            ),
                          ),
                        ),
                      ),

                      // Official Watermark
                      const PropertyWatermarkWidget(),

                      // Purpose / Category Badge
                      Positioned(
                        top: 10,
                        left: 10,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: property.isSale
                                    ? const Color(0xFFB8860B)
                                    : property.isCommercial
                                        ? const Color(0xFF4338CA)
                                        : const Color(0xFF0F766E),
                                borderRadius: BorderRadius.circular(6),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.25),
                                    blurRadius: 4,
                                  ),
                                ],
                              ),
                              child: Text(
                                property.isSale
                                    ? 'FOR SALE'
                                    : property.isCommercial
                                        ? 'COMMERCIAL'
                                        : 'FOR RENT',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            if (property.hasVideoTour) ...[
                              const SizedBox(width: 6),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.8),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.play_circle_fill, color: Colors.amber, size: 12),
                                    SizedBox(width: 3),
                                    Text(
                                      'Video',
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),

                      // Favorite Button
                      Positioned(
                        top: 10,
                        right: 10,
                        child: GestureDetector(
                          onTap: onToggleFavorite,
                          child: Container(
                            padding: const EdgeInsets.all(7),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.95),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.15),
                                  blurRadius: 4,
                                ),
                              ],
                            ),
                            child: Icon(
                              isFavorite ? Icons.favorite : Icons.favorite_border,
                              color: isFavorite ? Colors.red : Colors.grey.shade700,
                              size: 17,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Content Body with clear, high-contrast details
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // Flexible: a high-value sale price ("₹99.99 Cr")
                          // together with the brokerage badge overflowed a
                          // 360dp screen by 28px. The price shrinks to fit
                          // rather than pushing the badge off the card.
                          Flexible(
                            child: Text(
                              property.formattedPrice,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF0F172A),
                                letterSpacing: -0.4,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0F766E).withValues(alpha: 0.08),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: const Color(0xFF0F766E).withValues(alpha: 0.25),
                                width: 0.8,
                              ),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.verified, size: 12, color: Color(0xFF0F766E)),
                                SizedBox(width: 3),
                                Text(
                                  '0% Brokerage',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF0F766E),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        property.title,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 14, color: Color(0xFF0F766E)),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              property.locationLabel,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppTheme.textSecondary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFFF1F5F9)),
                        ),
                        // Wrap, not Row: BHK + Bath + area + the View
                        // affordance need about 474px side by side, which
                        // overflows every real phone (360-430dp). The previous
                        // Row was unconstrained so it took its intrinsic width
                        // and overflowed by ~76px on all of them; it went
                        // unnoticed because the default widget-test surface is
                        // 800px wide. Wrapping lets the specs flow to a second
                        // line on narrow screens instead of being clipped.
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Expanded(
                              child: Wrap(
                                spacing: 10,
                                runSpacing: 4,
                                crossAxisAlignment: WrapCrossAlignment.center,
                                children: [
                                  if (property.bedrooms > 0)
                                    _specChip(Icons.bed_outlined, "${property.bedrooms} BHK")
                                  else
                                    _specChip(Icons.business_outlined, property.propertyType),
                                  if (property.bathrooms > 0)
                                    _specChip(Icons.bathtub_outlined, "${property.bathrooms} Bath"),
                                  if (property.areaSqft > 0)
                                    _specChip(Icons.square_foot_outlined, "${property.areaSqft} sqft"),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text('View',
                                    style: TextStyle(
                                        color: AppTheme.primaryColor,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w800)),
                                SizedBox(width: 2),
                                Icon(Icons.arrow_forward_ios,
                                    size: 10, color: AppTheme.primaryColor),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
