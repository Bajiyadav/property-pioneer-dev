import 'package:flutter/material.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/config/theme.dart';

/// State → City pickers for the top of the home screen.
///
/// Reads and writes the same selection the rest of the app uses, so choosing a
/// city here is identical to choosing one anywhere else. The city list is
/// derived from the chosen state rather than being a flat list of every city,
/// which is what stops a visitor pairing a state with a city that is not in it.
class LocationPickerCard extends StatelessWidget {
  const LocationPickerCard({
    super.key,
    required this.selectedState,
    required this.selectedCity,
    required this.onStateChanged,
    required this.onCityChanged,
    this.onDetectLocation,
  });

  final String? selectedState;
  final String? selectedCity;
  final ValueChanged<String?> onStateChanged;
  final ValueChanged<String?> onCityChanged;

  /// Optional "use my location" affordance behind the crosshair.
  final VoidCallback? onDetectLocation;

  @override
  Widget build(BuildContext context) {
    final cities = selectedState == null
        ? const <String>[]
        : (AppConstants.citiesByState[selectedState] ?? const <String>[]);

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Semantics(
                button: onDetectLocation != null,
                label: onDetectLocation != null ? 'Use my current location' : null,
                child: InkWell(
                  onTap: onDetectLocation,
                  borderRadius: BorderRadius.circular(24),
                  child: Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: AppTheme.primaryColor.withValues(alpha: 0.10),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.my_location,
                        color: AppTheme.primaryColor, size: 22),
                  ),
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Text(
                  'Select a city to see local deals, or browse all categories below.',
                  style: TextStyle(
                    fontSize: 15,
                    height: 1.35,
                    color: AppTheme.textPrimary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _Dropdown(
            hint: 'Select State',
            value: selectedState,
            items: AppConstants.operatingStates,
            onChanged: onStateChanged,
          ),
          const SizedBox(height: 10),
          _Dropdown(
            hint: selectedState == null ? 'Select City' : 'Select City',
            value: selectedCity,
            items: cities,
            // Disabled until a state is chosen: the city list is meaningless
            // without one, and an enabled-but-empty menu reads as broken.
            onChanged: selectedState == null ? null : onCityChanged,
          ),
        ],
      ),
    );
  }
}

class _Dropdown extends StatelessWidget {
  const _Dropdown({
    required this.hint,
    required this.value,
    required this.items,
    required this.onChanged,
  });

  final String hint;
  final String? value;
  final List<String> items;
  final ValueChanged<String?>? onChanged;

  @override
  Widget build(BuildContext context) {
    final enabled = onChanged != null;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14),
      decoration: BoxDecoration(
        color: enabled ? const Color(0xFFF3F1EC) : const Color(0xFFF8F7F4),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          borderRadius: BorderRadius.circular(12),
          hint: Text(
            hint,
            style: TextStyle(
              fontSize: 15,
              color: enabled ? AppTheme.textPrimary : AppTheme.textSecondary,
            ),
          ),
          icon: Icon(Icons.keyboard_arrow_down_rounded,
              color: enabled ? AppTheme.textPrimary : AppTheme.textSecondary),
          items: items
              .map((v) => DropdownMenuItem(
                    value: v,
                    child: Text(v,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 15)),
                  ))
              .toList(),
          onChanged: onChanged,
          style: const TextStyle(fontSize: 15, color: AppTheme.textPrimary),
          padding: const EdgeInsets.symmetric(vertical: 8),
        ),
      ),
    );
  }
}

/// The lead category — full width, filled, and the only card carrying the
/// gradient. Everything beside it stays quiet so this one reads first.
class CategoryHeroCard extends StatelessWidget {
  const CategoryHeroCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.icon,
  });

  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          height: 148,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0F766E), Color(0xFF0B4F49)],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Stack(
            children: [
              if (icon != null)
                Positioned(
                  right: -10,
                  top: 14,
                  child: Icon(icon,
                      size: 104, color: Colors.white.withValues(alpha: 0.08)),
                ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 15,
                        fontWeight: FontWeight.w500,
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
}

/// A secondary category tile. Used in pairs and full width.
class CategoryCard extends StatelessWidget {
  const CategoryCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.icon,
    this.badge,
    this.emphasised = false,
  });

  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final IconData? icon;
  final String? badge;

  /// Draws the card in amber. Reserved for the owner listing action, which is
  /// the one card here that asks for supply rather than offering it.
  final bool emphasised;

  @override
  Widget build(BuildContext context) {
    final titleColor = emphasised ? Colors.white : AppTheme.textPrimary;
    final subtitleColor =
        emphasised ? Colors.white.withValues(alpha: 0.85) : AppTheme.textSecondary;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          decoration: BoxDecoration(
            color: emphasised ? null : Colors.white,
            gradient: emphasised
                ? const LinearGradient(
                    colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  )
                : null,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: emphasised
                  ? const Color(0xFFFBBF24)
                  : AppTheme.borderSubtle,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Stack(
            children: [
              if (icon != null)
                Positioned(
                  right: -6,
                  top: -6,
                  child: Icon(
                    icon,
                    size: 76,
                    color: emphasised
                        ? Colors.white.withValues(alpha: 0.16)
                        : AppTheme.primaryColor.withValues(alpha: 0.07),
                  ),
                ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (badge != null) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: emphasised
                              ? Colors.white.withValues(alpha: 0.22)
                              : AppTheme.primaryColor.withValues(alpha: 0.10),
                          borderRadius: BorderRadius.circular(5),
                        ),
                        child: Text(
                          badge!,
                          style: TextStyle(
                            fontSize: 9.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.5,
                            color:
                                emphasised ? Colors.white : AppTheme.primaryColor,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                    Text(
                      title,
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                        letterSpacing: -0.2,
                        color: titleColor,
                      ),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.3,
                        fontWeight: FontWeight.w500,
                        color: subtitleColor,
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
}
