import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:seedha_properties_mobile/config/env.dart';

/// Single, provider-configurable source of the map's tile layer and attribution.
///
/// The map renderer is flutter_map over OSM-derived raster tiles — no Google
/// Maps SDK, no Google API key, and zero Google API calls for property
/// discovery. Every map surface builds its tiles from here, so switching the
/// tile provider in production (a self-hosted OSM stack, or a licensed
/// OSM-derived vendor) is a single env change — MAP_TILE_URL — and needs no
/// edit to any property, search, or wizard screen. That is the abstraction the
/// architecture requires: production tiles can change without rewriting the UI.
///
/// If the project later moves to MapLibre vector tiles, this is the one seam
/// that changes; the callers stay the same.
class MapTiles {
  const MapTiles._();

  /// The configured raster tile layer. Defaults to OSM for local dev only.
  static TileLayer layer() {
    return TileLayer(
      urlTemplate: AppEnv.mapTileUrl,
      // Identifies the app to the tile server per OSM's usage policy.
      userAgentPackageName: 'com.seedhaproperties.mobile',
      // Keep memory bounded on lower-end devices.
      tileProvider: NetworkTileProvider(),
    );
  }

  /// Attribution overlay. OSM (and most OSM-derived vendors) require this to be
  /// visible on the map; it is not optional.
  static Widget attribution() {
    return RichAttributionWidget(
      showFlutterMapAttribution: false,
      attributions: [
        TextSourceAttribution(
          AppEnv.mapTileAttribution.replaceFirst('© ', ''),
        ),
      ],
    );
  }
}
