import 'dart:io';
import 'package:flutter_test/flutter_test.dart';

/// Production code must not carry fabricated property records.
///
/// A screen once shipped hardcoded listings with invented titles, prices and
/// match percentages. It was unreachable, but it sat in the binary one route
/// away from being shown to a real buyer. This walks the shipped source and
/// fails if that kind of fixture returns.
void main() {
  final lib = Directory('lib');

  List<File> dartFiles() => lib
      .listSync(recursive: true)
      .whereType<File>()
      .where((f) => f.path.endsWith('.dart'))
      .toList();

  test('no hardcoded fake property fixtures in lib/', () {
    final offenders = <String>[];
    for (final f in dartFiles()) {
      final src = f.readAsStringSync();
      for (final pattern in [
        RegExp(r'\bdummy[A-Z]\w*'),
        RegExp(r'\bmock(Propert|Listing)\w*'),
        RegExp(r'\bfake(Propert|Listing)\w*'),
        RegExp(r"'match'\s*:\s*\d"),
      ]) {
        if (pattern.hasMatch(src)) {
          offenders.add('${f.path} matched ${pattern.pattern}');
        }
      }
    }
    expect(offenders, isEmpty,
        reason: 'fabricated property data must not ship:\n${offenders.join('\n')}');
  });

  test('no Unsplash or stock photo URLs in lib/', () {
    // A stock house photo standing in for a real listing is the same problem
    // in image form.
    final offenders = dartFiles()
        .where((f) => f.readAsStringSync().contains('unsplash.com'))
        .map((f) => f.path)
        .toList();
    expect(offenders, isEmpty,
        reason: 'stock imagery must not represent a real listing: $offenders');
  });

  test('no provider API keys or direct Gemini calls in lib/', () {
    final offenders = <String>[];
    for (final f in dartFiles()) {
      final src = f.readAsStringSync();
      if (src.contains('generativelanguage.googleapis.com') ||
          RegExp(r'AIza[0-9A-Za-z_\-]{30,}').hasMatch(src) ||
          src.contains('service_role')) {
        offenders.add(f.path);
      }
    }
    expect(offenders, isEmpty,
        reason: 'no provider secret or direct provider call may ship: $offenders');
  });
}
