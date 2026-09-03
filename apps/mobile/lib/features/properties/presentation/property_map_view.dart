import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:seedha_properties_mobile/config/map_tiles.dart';
import 'package:latlong2/latlong.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';
import 'package:go_router/go_router.dart';

class PropertyMapView extends StatefulWidget {
  final List<Property> properties;
  final LatLng? centerLocation;
  final Set<String> favoriteIds;
  final Function(String) onToggleFavorite;

  const PropertyMapView({
    super.key,
    required this.properties,
    this.centerLocation,
    required this.favoriteIds,
    required this.onToggleFavorite,
  });

  @override
  State<PropertyMapView> createState() => _PropertyMapViewState();
}

class _PropertyMapViewState extends State<PropertyMapView> {
  final MapController _mapController = MapController();
  Property? _selectedProperty;

  @override
  Widget build(BuildContext context) {
    final propertiesWithCoords = widget.properties.where((p) => p.latitude != null && p.longitude != null).toList();

    LatLng initialCenter = widget.centerLocation ?? const LatLng(20.5937, 78.9629); // Center of India default
    if (propertiesWithCoords.isNotEmpty && widget.centerLocation == null) {
      initialCenter = LatLng(propertiesWithCoords.first.latitude!, propertiesWithCoords.first.longitude!);
    }

    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController,
          options: MapOptions(
            initialCenter: initialCenter,
            initialZoom: widget.centerLocation != null ? 12.0 : 4.0,
            onTap: (tapPosition, point) {
              if (_selectedProperty != null) {
                setState(() => _selectedProperty = null);
              }
            },
          ),
          children: [
            MapTiles.layer(),
            MapTiles.attribution(),
            MarkerLayer(
              markers: propertiesWithCoords.map((prop) {
                final isSelected = _selectedProperty?.id == prop.id;
                return Marker(
                  point: LatLng(prop.latitude!, prop.longitude!),
                  width: 40,
                  height: 40,
                  child: GestureDetector(
                    onTap: () {
                      setState(() {
                        _selectedProperty = prop;
                      });
                      _mapController.move(LatLng(prop.latitude!, prop.longitude!), 14.0);
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: isSelected ? Colors.amber[800] : AppTheme.primaryColor,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                        boxShadow: const [
                          BoxShadow(color: Colors.black26, blurRadius: 4, offset: Offset(0, 2))
                        ],
                      ),
                      child: const Icon(
                        Icons.home,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
        ),
        if (_selectedProperty != null)
          Positioned(
            left: 16,
            right: 16,
            bottom: 32,
            child: GestureDetector(
              onTap: () => context.push('/properties/${_selectedProperty!.id}'),
              child: Container(
                constraints: const BoxConstraints(maxHeight: 180),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 12, offset: const Offset(0, 4))
                  ],
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: PropertyCardWidget(
                    property: _selectedProperty!,
                    isFavorite: widget.favoriteIds.contains(_selectedProperty!.id),
                    onToggleFavorite: () => widget.onToggleFavorite(_selectedProperty!.id),
                    onTap: () => context.push('/properties/${_selectedProperty!.id}'),
                  ),
                ),
              ),
            ),
          ),
        // Coordinates are optional on a listing, and most are published without
        // one. Say so plainly instead of leaving an empty map that looks broken
        // — and never drop a pin at a guessed position to fill the space.
        if (propertiesWithCoords.isEmpty)
          Positioned(
            left: 20,
            right: 20,
            top: 0,
            bottom: 0,
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.borderSubtle),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.10),
                      blurRadius: 18,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.location_off_outlined,
                        size: 38, color: AppTheme.textSecondary),
                    const SizedBox(height: 12),
                    Text(
                      widget.properties.isEmpty
                          ? 'No properties to map'
                          : 'These listings have no map location',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      widget.properties.isEmpty
                          ? 'Adjust your filters or location to see results here.'
                          : 'Owners have not pinned these ${widget.properties.length} '
                              'properties yet. Switch to List to browse them.',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          fontSize: 12.5,
                          height: 1.35,
                          color: AppTheme.textSecondary),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
