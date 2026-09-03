import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/config/env.dart';
import 'package:seedha_properties_mobile/config/map_tiles.dart';

/// Guards the cost/provider model for the map: OSM-derived raster tiles through
/// a single configurable seam, no Google. If someone hardcodes a Google tile
/// URL or drops the attribution, these fail.
void main() {
  test('tile URL defaults to an OSM-derived server and is never a Google host', () {
    final url = AppEnv.mapTileUrl;
    expect(url, contains('{z}/{x}/{y}'));
    expect(url.toLowerCase(), isNot(contains('google')));
    expect(url.toLowerCase(), isNot(contains('maps.googleapis.com')));
    // The default is OSM; production overrides it via --dart-define=MAP_TILE_URL.
    expect(url, contains('openstreetmap.org'));
  });

  test('MapTiles.layer() renders the configured URL, not a hardcoded one', () {
    final layer = MapTiles.layer();
    expect(layer, isA<TileLayer>());
    expect(layer.urlTemplate, AppEnv.mapTileUrl);
  });

  test('attribution is present and non-empty (OSM policy requires it)', () {
    expect(AppEnv.mapTileAttribution, isNotEmpty);
    expect(AppEnv.mapTileAttribution.toLowerCase(), contains('openstreetmap'));
    final widget = MapTiles.attribution();
    expect(widget, isA<Widget>());
  });
}
