import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/config/constants.dart';

void main() {
  group('PropertyCategory & Constants Tests', () {
    test('PropertyCategory has correct labels and database mapping', () {
      expect(PropertyCategory.rent.label, 'Rent');
      expect(PropertyCategory.rent.dbListingType, 'rent');

      expect(PropertyCategory.buy.label, 'Buy');
      expect(PropertyCategory.buy.dbListingType, 'sale');

      expect(PropertyCategory.commercial.label, 'Commercial');
      expect(PropertyCategory.commercial.dbListingType, 'commercial');
    });

    test('AppConstants contains top Indian metropolitan hubs', () {
      expect(AppConstants.topMetroCities, contains('All India'));
      expect(AppConstants.topMetroCities, contains('Bengaluru'));
      expect(AppConstants.topMetroCities, contains('Mumbai'));
      expect(AppConstants.topMetroCities, contains('Delhi NCR'));
      expect(AppConstants.topMetroCities, contains('Hyderabad'));
      expect(AppConstants.topMetroCities, contains('Pune'));
      expect(AppConstants.topMetroCities, contains('Chennai'));
      expect(AppConstants.topMetroCities, contains('Kolkata'));
      expect(AppConstants.topMetroCities, contains('Ahmedabad'));
    });

    test('AppConstants has localities configured for each major metro', () {
      expect(AppConstants.cityLocalities['Bengaluru'], contains('Indiranagar'));
      expect(AppConstants.cityLocalities['Mumbai'], contains('Bandra West'));
      expect(AppConstants.cityLocalities['Delhi NCR'], contains('Golf Course Road'));
      expect(AppConstants.cityLocalities['Hyderabad'], contains('Gachibowli'));
      expect(AppConstants.cityLocalities['Pune'], contains('Hinjawadi'));
      expect(AppConstants.cityLocalities['Chennai'], contains('OMR'));
      expect(AppConstants.cityLocalities['Kolkata'], contains('Salt Lake'));
    });
  });
}
