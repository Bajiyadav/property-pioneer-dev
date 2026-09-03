import 'package:flutter/material.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:cached_network_image/cached_network_image.dart';

/// Compact spec badge on the small property card.
Widget _specChip(IconData icon, String label) {
  return Container(
    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
    decoration: BoxDecoration(
      color: const Color(0xFFF1F5F9),
      borderRadius: BorderRadius.circular(6),
    ),
    child: Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 13, color: const Color(0xFF475569)),
        const SizedBox(width: 3.5),
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: Color(0xFF334155),
          ),
        ),
      ],
    ),
  );
}

class PropertyCardWidget extends StatelessWidget {
  final Property property;
  final VoidCallback onTap;
  final bool isFavorite;
  final VoidCallback? onToggleFavorite;
  final VoidCallback? onContact;

  const PropertyCardWidget({
    super.key,
    required this.property,
    required this.onTap,
    this.isFavorite = false,
    this.onToggleFavorite,
    this.onContact,
  });

  @override
  Widget build(BuildContext context) {
    final String? coverImage =
        property.images.isNotEmpty ? property.images.first : null;

    final String ownerInitials = (property.ownerName != null && property.ownerName!.trim().isNotEmpty)
        ? property.ownerName!.trim().split(' ').map((s) => s.isNotEmpty ? s[0] : '').take(2).join().toUpperCase()
        : 'DO';

    final String ownerDisplayName = (property.ownerName != null && property.ownerName!.trim().isNotEmpty)
        ? property.ownerName!
        : 'Direct Owner';

    final String possessionStatus = property.status.toLowerCase().contains('construction')
        ? 'Under Construction'
        : 'Ready to Move';

    final String titleSubtitle = property.bedrooms > 0
        ? '${property.bedrooms} BHK ${property.propertyType} • ${property.title}'
        : '${property.propertyType} • ${property.title}';

    final String loc = property.locality ?? '';
    final String city = property.city;
    final String locationDisplay = loc.isNotEmpty
        ? (city.isNotEmpty ? '$loc, $city' : loc)
        : city;

    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 620),
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            margin: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF0F172A).withValues(alpha: 0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                // 1. Compact Image Header (~130dp height)
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: Stack(
                    children: [
                      SizedBox(
                        height: 130,
                        width: double.infinity,
                        child: coverImage == null
                            ? Container(
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [Color(0xFFF1F5F9), Color(0xFFE2E8F0)],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                ),
                                child: const Center(
                                  child: Icon(Icons.home_work_outlined,
                                      size: 40, color: Color(0xFF94A3B8)),
                                ),
                              )
                            : CachedNetworkImage(
                                imageUrl: coverImage,
                                fit: BoxFit.cover,
                                placeholder: (context, url) => Container(
                                  color: const Color(0xFFF1F5F9),
                                  child: const Center(
                                    child: SizedBox(
                                      width: 20,
                                      height: 20,
                                      child: CircularProgressIndicator(strokeWidth: 2),
                                    ),
                                  ),
                                ),
                                errorWidget: (context, url, error) => Container(
                                  color: const Color(0xFFF1F5F9),
                                  child: const Center(
                                    child: Icon(Icons.home_work_outlined,
                                        size: 40, color: Color(0xFF94A3B8)),
                                  ),
                                ),
                              ),
                      ),

                      // Gradient overlay for better contrast
                      Positioned.fill(
                        child: DecoratedBox(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.black.withValues(alpha: 0.35),
                                Colors.transparent,
                                Colors.black.withValues(alpha: 0.45),
                              ],
                              stops: const [0.0, 0.4, 1.0],
                            ),
                          ),
                        ),
                      ),

                      // Verified Owner Badge + Zero Brokerage Pill (Top Left)
                      Positioned(
                        top: 9,
                        left: 9,
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                              decoration: BoxDecoration(
                                color: const Color(0xFFE58A1F),
                                borderRadius: BorderRadius.circular(6),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.2),
                                    blurRadius: 3,
                                  ),
                                ],
                              ),
                              child: const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.shield_outlined, color: Colors.white, size: 12),
                                  SizedBox(width: 3.5),
                                  Text(
                                    'Verified Owner',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w800,
                                      letterSpacing: 0.2,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F766E),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Text(
                                '0% Brokerage',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Favorite Heart Button (Top Right)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: onToggleFavorite,
                          child: Container(
                            height: 32,
                            width: 32,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.92),
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.15),
                                  blurRadius: 4,
                                  offset: const Offset(0, 1.5),
                                ),
                              ],
                            ),
                            child: Center(
                              child: Icon(
                                isFavorite ? Icons.favorite : Icons.favorite_border,
                                color: isFavorite ? const Color(0xFFE11D48) : const Color(0xFF1E293B),
                                size: 17,
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Photo count indicator (Bottom Right)
                      Positioned(
                        bottom: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.65),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.photo_camera_outlined, color: Colors.white, size: 11),
                              const SizedBox(width: 3.5),
                              Text(
                                '${property.images.isNotEmpty ? property.images.length : 1}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 10,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // 2. Compact Content Body
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Price & Possession Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
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
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              possessionStatus,
                              style: const TextStyle(
                                fontSize: 10.5,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF475569),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 3),

                      // Title & BHK
                      Text(
                        titleSubtitle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13.5,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 2.5),

                      // Locality & City
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 13, color: Color(0xFF64748B)),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              locationDisplay,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontSize: 11.5,
                                color: Color(0xFF64748B),
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Compact Specs Row (Beds, Baths, Sqft)
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          if (property.bedrooms > 0)
                            _specChip(Icons.king_bed_outlined, "${property.bedrooms} Beds"),
                          if (property.bathrooms > 0)
                            _specChip(Icons.shower_outlined, "${property.bathrooms} Baths"),
                          if (property.areaSqft > 0)
                            _specChip(Icons.square_foot_outlined, "${property.areaSqft} sqft"),
                        ],
                      ),
                      const SizedBox(height: 8),

                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                      const SizedBox(height: 7),

                      // Owner & Contact Action Row
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 13,
                            backgroundColor: const Color(0xFF0F766E),
                            child: Text(
                              ownerInitials,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const SizedBox(width: 7),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  ownerDisplayName,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: const TextStyle(
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                const Text(
                                  'Direct Owner • Zero Brokerage',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFF16A34A),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: onContact ?? onTap,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF0F766E),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: const Text(
                              'Contact',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
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
