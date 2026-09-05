import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/config/theme.dart';

/// State → City pickers for the top of the home screen or modal sheet.
class LocationPickerCard extends StatefulWidget {
  const LocationPickerCard({
    super.key,
    required this.selectedState,
    required this.selectedCity,
    required this.onStateChanged,
    required this.onCityChanged,
    this.onDetectLocation,
    this.onExploreDeals,
    this.availableStates,
    this.availableCities,
    this.isLoading = false,
    this.errorMessage,
    this.onRetry,
  });

  final String? selectedState;
  final String? selectedCity;
  final ValueChanged<String?> onStateChanged;
  final ValueChanged<String?> onCityChanged;
  final VoidCallback? onDetectLocation;
  final VoidCallback? onExploreDeals;
  final List<String>? availableStates;
  final List<String>? availableCities;
  final bool isLoading;
  final String? errorMessage;
  final VoidCallback? onRetry;

  @override
  State<LocationPickerCard> createState() => _LocationPickerCardState();
}

class _LocationPickerCardState extends State<LocationPickerCard> {
  final TextEditingController _searchController = TextEditingController();
  String _filterQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final rawStates = widget.availableStates ?? AppConstants.allStates;
    final sortedStates = List<String>.from(rawStates)
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));

    final rawCities = widget.availableCities ??
        (widget.selectedState == null
            ? const <String>[]
            : (AppConstants.citiesByState[widget.selectedState] ?? const <String>[]));
    final sortedCities = List<String>.from(rawCities)
      ..sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));

    final q = _filterQuery.trim().toLowerCase();
    final filteredStates = q.isEmpty
        ? sortedStates
        : sortedStates.where((s) => s.toLowerCase().contains(q)).toList();
    final filteredCities = q.isEmpty
        ? sortedCities
        : sortedCities.where((c) => c.toLowerCase().contains(q)).toList();

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
                button: widget.onDetectLocation != null,
                label: widget.onDetectLocation != null ? 'Use my current location' : null,
                child: InkWell(
                  onTap: widget.onDetectLocation,
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
                  'Select a city to see verified direct-owner properties.',
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
          if (widget.errorMessage != null && sortedCities.isEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline_rounded, color: Color(0xFFDC2626), size: 18),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      widget.errorMessage!,
                      style: const TextStyle(fontSize: 12, color: Color(0xFF991B1B)),
                    ),
                  ),
                  if (widget.onRetry != null) ...[
                    const SizedBox(width: 6),
                    TextButton(
                      onPressed: widget.onRetry,
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        foregroundColor: const Color(0xFFDC2626),
                      ),
                      child: const Text('Retry', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 12)),
                    ),
                  ],
                ],
              ),
            ),
          ],
          if (widget.isLoading) ...[
            const SizedBox(height: 10),
            const LinearProgressIndicator(color: AppTheme.primaryColor, minHeight: 2),
          ],
          const SizedBox(height: 14),
          // Searchable typing input to find location quickly
          TextField(
            controller: _searchController,
            onChanged: (val) {
              setState(() {
                _filterQuery = val;
              });
            },
            decoration: InputDecoration(
              hintText: widget.selectedState == null
                  ? 'Type to search state (e.g. Telangana, Maharashtra)...'
                  : 'Type to search city in ${widget.selectedState}...',
              hintStyle: const TextStyle(fontSize: 13.5, color: Color(0xFF94A3B8)),
              prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
              suffixIcon: _filterQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear_rounded, size: 18, color: Color(0xFF64748B)),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _filterQuery = '';
                        });
                      },
                    )
                  : null,
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              isDense: true,
              filled: true,
              fillColor: const Color(0xFFF8FAFC),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppTheme.primaryColor, width: 1.5),
              ),
            ),
            style: const TextStyle(fontSize: 14, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 12),
          _Dropdown(
            hint: 'Select State (A → Z)',
            value: filteredStates.contains(widget.selectedState) ? widget.selectedState : null,
            items: filteredStates,
            onChanged: (val) {
              widget.onStateChanged(val);
              if (_filterQuery.isNotEmpty) {
                _searchController.clear();
                setState(() {
                  _filterQuery = '';
                });
              }
            },
          ),
          const SizedBox(height: 10),
          _Dropdown(
            hint: widget.selectedState == null
                ? 'Select City'
                : (widget.isLoading ? 'Loading cities...' : 'Select City (A → Z)'),
            value: filteredCities.contains(widget.selectedCity) ? widget.selectedCity : null,
            items: filteredCities,
            onChanged: (widget.selectedState == null || widget.isLoading)
                ? null
                : (val) {
                    widget.onCityChanged(val);
                    if (_filterQuery.isNotEmpty) {
                      _searchController.clear();
                      setState(() {
                        _filterQuery = '';
                      });
                    }
                  },
          ),
          if (widget.selectedState != null && filteredCities.isNotEmpty) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF16A34A),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text(
                          'NEXT STEP',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Tap your city in ${widget.selectedState} (A → Z):',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: Color(0xFF15803D),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: filteredCities.map((city) {
                      final isSelected = widget.selectedCity == city;
                      return InkWell(
                        onTap: () => widget.onCityChanged(city),
                        borderRadius: BorderRadius.circular(10),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF0F766E) : Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isSelected ? const Color(0xFF0F766E) : const Color(0xFFCBD5E1),
                              width: isSelected ? 1.8 : 1.0,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: isSelected ? 0.08 : 0.03),
                                blurRadius: 4,
                                offset: const Offset(0, 1),
                              ),
                            ],
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.location_on_rounded,
                                size: 14,
                                color: isSelected ? Colors.white : const Color(0xFF0F766E),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                city,
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                  color: isSelected ? Colors.white : const Color(0xFF0F172A),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
          if (widget.selectedCity != null && widget.onExploreDeals != null) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: widget.onExploreDeals,
                icon: const Icon(Icons.explore_outlined, size: 18),
                label: Text(
                  'Explore ${widget.selectedCity} Deals',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 0,
                ),
              ),
            ),
          ],
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

/// Animated Painting/Writing Typewriter Quotes Header
class AnimatedPaintingQuoteHeader extends StatefulWidget {
  const AnimatedPaintingQuoteHeader({
    super.key,
    this.quotes = const [
      'Zero Brokerage. 100% Direct Owners.',
      'Find Your Dream Home Without Middlemen.',
      'Verified Properties & Legal Agreements.',
      'Connect Directly with Genuine Owners.',
      'Save Lakhs in Brokerage Forever.',
    ],
  });

  final List<String> quotes;

  @override
  State<AnimatedPaintingQuoteHeader> createState() =>
      _AnimatedPaintingQuoteHeaderState();
}

class _AnimatedPaintingQuoteHeaderState
    extends State<AnimatedPaintingQuoteHeader>
    with SingleTickerProviderStateMixin {
  int _quoteIndex = 0;
  String _displayedText = '';
  int _charIndex = 0;
  bool _isDeleting = false;
  Timer? _typewriterTimer;

  late final AnimationController _cursorController;

  @override
  void initState() {
    super.initState();
    _cursorController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);

    _startTypewriting();
  }

  @override
  void dispose() {
    _typewriterTimer?.cancel();
    _cursorController.dispose();
    super.dispose();
  }

  void _startTypewriting() {
    _typewriterTimer?.cancel();
    final currentQuote = widget.quotes[_quoteIndex];

    _typewriterTimer = Timer.periodic(const Duration(milliseconds: 65), (timer) {
      if (!mounted) return;

      if (!_isDeleting) {
        if (_charIndex < currentQuote.length) {
          _charIndex++;
          setState(() {
            _displayedText = currentQuote.substring(0, _charIndex);
          });
        } else {
          // Finished typing current quote, pause and then delete
          timer.cancel();
          _typewriterTimer = Timer(const Duration(milliseconds: 2400), () {
            if (!mounted) return;
            setState(() => _isDeleting = true);
            _startTypewriting();
          });
        }
      } else {
        if (_charIndex > 0) {
          _charIndex--;
          setState(() {
            _displayedText = currentQuote.substring(0, _charIndex);
          });
        } else {
          // Finished deleting, move to next quote
          timer.cancel();
          _isDeleting = false;
          _quoteIndex = (_quoteIndex + 1) % widget.quotes.length;
          _typewriterTimer = Timer(const Duration(milliseconds: 400), () {
            if (!mounted) return;
            _startTypewriting();
          });
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFFE11D48), Color(0xFFBE123C)],
                  ),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFE11D48).withValues(alpha: 0.25),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.auto_awesome, size: 12, color: Colors.white),
                    SizedBox(width: 4),
                    Text(
                      'SEEDHA PROMISE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ConstrainedBox(
            constraints: const BoxConstraints(minHeight: 56),
            child: Center(
              child: RichText(
                textAlign: TextAlign.center,
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: _displayedText,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.3,
                        color: Color(0xFF0F172A),
                        height: 1.25,
                      ),
                    ),
                    WidgetSpan(
                      alignment: PlaceholderAlignment.middle,
                      child: AnimatedBuilder(
                        animation: _cursorController,
                        builder: (context, child) {
                          return Opacity(
                            opacity: _cursorController.value > 0.4 ? 1.0 : 0.0,
                            child: Container(
                              margin: const EdgeInsets.only(left: 3),
                              width: 3,
                              height: 20,
                              decoration: BoxDecoration(
                                color: const Color(0xFFE11D48),
                                borderRadius: BorderRadius.circular(1.5),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// "ONE STOP SHOP" Hero Header (Supports animated painting quotes)
class OneStopShopHeader extends StatelessWidget {
  const OneStopShopHeader({
    super.key,
    this.title = 'ONE STOP SHOP',
    this.subtitle = 'For All Your Direct Property Needs',
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    return const AnimatedPaintingQuoteHeader();
  }
}

/// Large "Search Property" Hero Card with Stylized 3D Buildings Illustration
class HeroSearchCard extends StatelessWidget {
  const HeroSearchCard({
    super.key,
    required this.onTap,
  });

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(20),
        child: Ink(
          height: 220,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFFE11D48), Color(0xFFBE123C), Color(0xFF881337)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFE11D48).withValues(alpha: 0.28),
                blurRadius: 16,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Stack(
            children: [
              // 3D Architectural building silhouette illustration
              Positioned(
                right: -12,
                bottom: -10,
                child: Opacity(
                  opacity: 0.85,
                  child: Container(
                    width: 140,
                    height: 140,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.12),
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(32),
                      ),
                    ),
                    child: Stack(
                      children: [
                        Positioned(
                          right: 12,
                          bottom: 0,
                          child: Icon(
                            Icons.apartment_rounded,
                            size: 110,
                            color: Colors.white.withValues(alpha: 0.22),
                          ),
                        ),
                        Positioned(
                          left: 10,
                          bottom: 0,
                          child: Icon(
                            Icons.location_city_rounded,
                            size: 75,
                            color: Colors.white.withValues(alpha: 0.30),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.20),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.search_rounded, size: 13, color: Colors.white),
                          SizedBox(width: 4),
                          Text(
                            'EXPLORE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.6,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Search Property',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.4,
                      ),
                    ),
                    const SizedBox(height: 10),
                    _featureRow(Icons.check_circle_rounded, 'Buy & Rent Effortlessly'),
                    const SizedBox(height: 5),
                    _featureRow(Icons.domain_rounded, 'Residential & Commercial'),
                    const SizedBox(height: 5),
                    _featureRow(Icons.verified_user_rounded, '100% Zero Brokerage'),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _featureRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.white.withValues(alpha: 0.90)),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.92),
            fontSize: 12.5,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}

/// Action Tile with clean rounded aesthetic, badge, and feature lines
class ActionServiceTile extends StatelessWidget {
  const ActionServiceTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    this.badge,
    this.gradientColors,
    this.textColor = Colors.white,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final String? badge;
  final List<Color>? gradientColors;
  final Color textColor;

  @override
  Widget build(BuildContext context) {
    final colors = gradientColors ??
        const [Color(0xFF334155), Color(0xFF1E293B)];

    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Ink(
          height: 104,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: colors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: colors.first.withValues(alpha: 0.22),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Stack(
            children: [
              Positioned(
                right: -6,
                bottom: -6,
                child: Icon(
                  icon,
                  size: 64,
                  color: Colors.white.withValues(alpha: 0.12),
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Text(
                            title,
                            style: TextStyle(
                              color: textColor,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.2,
                            ),
                          ),
                        ),
                        if (badge != null)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.24),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              badge!,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 9,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 0.4,
                              ),
                            ),
                          ),
                      ],
                    ),
                    Text(
                      subtitle,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: textColor.withValues(alpha: 0.85),
                        fontSize: 11.5,
                        fontWeight: FontWeight.w500,
                        height: 1.25,
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

/// Horizontal scrolling "Essential Services" section with forward-and-back floating card micro-animations
class AnimatedHomeServicesSection extends StatefulWidget {
  const AnimatedHomeServicesSection({
    super.key,
    required this.onRentalAgreementTap,
    required this.onVisitsTap,
    required this.onAiAssistantTap,
    required this.onHomeLoansTap,
  });

  final VoidCallback onRentalAgreementTap;
  final VoidCallback onVisitsTap;
  final VoidCallback onAiAssistantTap;
  final VoidCallback onHomeLoansTap;

  @override
  State<AnimatedHomeServicesSection> createState() =>
      _AnimatedHomeServicesSectionState();
}

class _AnimatedHomeServicesSectionState extends State<AnimatedHomeServicesSection>
    with SingleTickerProviderStateMixin {
  late final ScrollController _scrollController;
  Timer? _autoScrollTimer;
  Timer? _resumeTimer;
  bool _isUserInteracting = false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _startAutoScroll();
  }

  void _startAutoScroll() {
    _autoScrollTimer?.cancel();
    _autoScrollTimer = Timer.periodic(const Duration(milliseconds: 20), (timer) {
      if (!mounted || !_scrollController.hasClients || _isUserInteracting) return;

      final max = _scrollController.position.maxScrollExtent;
      final current = _scrollController.offset;

      if (current >= max - 1) {
        _scrollController.jumpTo(0.0);
      } else {
        _scrollController.jumpTo(current + 2.0);
      }
    });
  }

  @override
  void dispose() {
    _autoScrollTimer?.cancel();
    _resumeTimer?.cancel();
    _scrollController.dispose();
    super.dispose();
  }

  List<Widget> _buildServiceCards() {
    return const [
      _ServiceCardItem(
        title: 'Rental Agreement',
        subtitle: 'E-Stamp & Biometrics',
        icon: Icons.description_outlined,
        badge: 'LEGAL DRAFT',
        color: Color(0xFF4338CA),
      ),
      SizedBox(width: 10),
      _ServiceCardItem(
        title: 'Schedule Visits',
        subtitle: 'Direct Site Slots',
        icon: Icons.calendar_month_outlined,
        badge: 'VERIFIED',
        color: Color(0xFF0D9488),
      ),
      SizedBox(width: 10),
      _ServiceCardItem(
        title: 'Home Loans',
        subtitle: 'Lowest Interest Rates',
        icon: Icons.account_balance_outlined,
        badge: 'PRE-APPROVED',
        color: Color(0xFFD97706),
      ),
      SizedBox(width: 10),
      _ServiceCardItem(
        title: 'Seedha AI Advisor',
        subtitle: '24/7 PropTech Guidance',
        icon: Icons.auto_awesome_rounded,
        badge: 'GROUNDED',
        color: Color(0xFF2563EB),
      ),
      SizedBox(width: 10),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.home_repair_service_rounded,
                        size: 20, color: Color(0xFF0F766E)),
                    SizedBox(width: 8),
                    Text(
                      'Essential Services',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        color: Color(0xFF0F172A),
                      ),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F766E).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.bolt_rounded, size: 14, color: Color(0xFF0F766E)),
                      SizedBox(width: 2),
                      Text(
                        'Direct & Instant',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F766E),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          NotificationListener<UserScrollNotification>(
            onNotification: (notification) {
              if (notification.direction != ScrollDirection.idle) {
                _resumeTimer?.cancel();
                _isUserInteracting = true;
              } else {
                _resumeTimer?.cancel();
                _resumeTimer = Timer(const Duration(milliseconds: 1500), () {
                  if (mounted) _isUserInteracting = false;
                });
              }
              return false;
            },
            child: SizedBox(
              height: 124,
              child: ListView(
                controller: _scrollController,
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  ..._buildServiceCards(),
                  ..._buildServiceCards(),
                  ..._buildServiceCards(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Compact pair of small cards for Property Management & Rental Agreement
class PropertyManagementAndAgreementCards extends StatelessWidget {
  const PropertyManagementAndAgreementCards({
    super.key,
    required this.onPropertyManagementTap,
    required this.onRentalAgreementTap,
  });

  final VoidCallback onPropertyManagementTap;
  final VoidCallback onRentalAgreementTap;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Property Management Small Card
        Expanded(
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onPropertyManagementTap,
              borderRadius: BorderRadius.circular(16),
              child: Ink(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F766E), Color(0xFF115E59)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F766E).withValues(alpha: 0.22),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.admin_panel_settings_rounded,
                              color: Colors.white, size: 20),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.24),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'DIRECT CARE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 8.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Property Management',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'Tenant verification & rent collection',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 12),
        // Rental Agreement Small Card
        Expanded(
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: onRentalAgreementTap,
              borderRadius: BorderRadius.circular(16),
              child: Ink(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF4338CA), Color(0xFF3730A3)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF4338CA).withValues(alpha: 0.22),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.18),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.assignment_turned_in_rounded,
                              color: Colors.white, size: 20),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.24),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            '100% ONLINE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 8.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.4,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Rental Agreement',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      'E-Stamp & legal drafting delivered',
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.85),
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _ServiceCardItem extends StatelessWidget {
  const _ServiceCardItem({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.badge,
    required this.color,
  });

  final String title;
  final String subtitle;
  final IconData icon;
  final String badge;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 172,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.10),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 4),
              Flexible(
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    badge,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(
                      fontSize: 8.5,
                      fontWeight: FontWeight.w800,
                      color: color,
                    ),
                  ),
                ),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E293B),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Category Hero Card — kept for backward compatibility and test stability
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

/// Secondary Category Card — kept for backward compatibility and test stability
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
