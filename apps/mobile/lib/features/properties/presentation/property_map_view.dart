import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
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
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.seedhaproperties.mobile',
            ),
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
              onTap: () => context.go('/properties/${_selectedProperty!.id}'),
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
                    onTap: () => context.go('/properties/${_selectedProperty!.id}'),
                  ),
                ),
              ),
            ),
          ),
        if (propertiesWithCoords.isEmpty)
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                'No properties with map coordinates available in this area.',
                style: TextStyle(color: Colors.white),
                textAlign: TextAlign.center,
              ),
            ),
          ),
      ],
    );
  }
}
