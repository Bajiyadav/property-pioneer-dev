package com.seedha.properties;

import com.seedha.properties.controller.LocationController;
import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.service.LocationService;
import com.seedha.properties.service.LocationService.LocationItem;
import com.seedha.properties.service.LocationService.LocationNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

public class LocationMasterTests {

    private LocationService locationService;
    private LocationController locationController;

    @BeforeEach
    void setUp() {
        locationService = new LocationService(null); // Pure in-memory authoritative verification
        locationController = new LocationController(locationService);
    }

    @Test
    @DisplayName("Should return all 28 Indian States and 8 Union Territories (Total 36)")
    void testAllStatesAndUnionTerritories() {
        ResponseEntity<ApiResponse<List<LocationNode>>> response = locationController.getStates();
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();

        List<LocationNode> states = response.getBody().getData();
        assertThat(states).hasSize(36);

        long stateCount = states.stream().filter(s -> "STATE".equals(s.type())).count();
        long utCount = states.stream().filter(s -> "UNION_TERRITORY".equals(s.type())).count();

        assertThat(stateCount).isEqualTo(28);
        assertThat(utCount).isEqualTo(8);

        // Core states must be present
        List<String> stateNames = states.stream().map(LocationNode::name).toList();
        assertThat(stateNames).contains(
                "Andhra Pradesh", "Telangana", "Karnataka", "Maharashtra", "Tamil Nadu",
                "Delhi", "Gujarat", "Kerala", "Uttar Pradesh", "West Bengal"
        );
    }

    @Test
    @DisplayName("Andhra Pradesh must contain all 26 official reorganized districts")
    void testAndhraPradeshCoverage() {
        ResponseEntity<ApiResponse<List<LocationNode>>> response = locationController.getDistricts("in-ap");
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();

        List<LocationNode> districts = response.getBody().getData();
        assertThat(districts).hasSize(26);

        List<String> districtNames = districts.stream().map(LocationNode::name).toList();
        assertThat(districtNames).contains(
                "Visakhapatnam", "NTR", "Guntur", "Tirupati", "Sri Potti Sriramulu Nellore",
                "Kurnool", "Nandyal", "East Godavari", "Kakinada", "West Godavari",
                "Eluru", "Ananthapuramu", "Sri Sathya Sai", "YSR Kadapa", "Annamayya",
                "Chittoor", "Prakasam", "Palnadu", "Srikakulam", "Vizianagaram",
                "Dr. B.R. Ambedkar Konaseema", "Alluri Sitharama Raju", "Anakapalli",
                "Bapatla", "Parvathipuram Manyam"
        );
    }

    @Test
    @DisplayName("Telangana must contain all 33 official reorganized districts")
    void testTelanganaCoverage() {
        ResponseEntity<ApiResponse<List<LocationNode>>> response = locationController.getDistricts("in-ts");
        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(response.getBody()).isNotNull();

        List<LocationNode> districts = response.getBody().getData();
        assertThat(districts).hasSize(33);

        List<String> districtNames = districts.stream().map(LocationNode::name).toList();
        assertThat(districtNames).contains(
                "Hyderabad", "Ranga Reddy", "Medchal-Malkajgiri", "Hanamkonda", "Warangal",
                "Karimnagar", "Nizamabad", "Khammam", "Bhadradri Kothagudem", "Mahabubnagar",
                "Nalgonda", "Suryapet", "Siddipet", "Sangareddy", "Peddapalli",
                "Rajanna Sircilla", "Jagtial", "Mancherial", "Nirmal", "Adilabad"
        );
    }

    @Test
    @DisplayName("District to City/Town hierarchy cascades accurately")
    void testDistrictToCityCascade() {
        // Visakhapatnam District -> Visakhapatnam city
        ResponseEntity<ApiResponse<List<LocationNode>>> vspCities =
                locationController.getCitiesByDistrict("in-ap-visakhapatnam");
        assertThat(vspCities.getBody()).isNotNull();
        assertThat(vspCities.getBody().getData().stream().map(LocationNode::name).toList())
                .contains("Visakhapatnam", "Bheemunipatnam");

        // NTR District -> Vijayawada
        ResponseEntity<ApiResponse<List<LocationNode>>> ntrCities =
                locationController.getCitiesByDistrict("in-ap-ntr");
        assertThat(ntrCities.getBody()).isNotNull();
        assertThat(ntrCities.getBody().getData().stream().map(LocationNode::name).toList())
                .contains("Vijayawada");

        // Hyderabad District -> Hyderabad & Secunderabad
        ResponseEntity<ApiResponse<List<LocationNode>>> hydCities =
                locationController.getCitiesByDistrict("in-ts-hyderabad");
        assertThat(hydCities.getBody()).isNotNull();
        assertThat(hydCities.getBody().getData().stream().map(LocationNode::name).toList())
                .contains("Hyderabad", "Secunderabad");
    }

    @Test
    @DisplayName("Natural search matches localities, cities, and pincodes accurately with ranking")
    void testNaturalSearch() {
        ResponseEntity<ApiResponse<List<LocationItem>>> searchRes =
                locationController.searchLocations("Gachibowli", null, 10);
        assertThat(searchRes.getBody()).isNotNull();
        List<LocationItem> items = searchRes.getBody().getData();
        assertThat(items).isNotEmpty();
        assertThat(items.get(0).locality()).isEqualTo("Gachibowli");
        assertThat(items.get(0).city()).isEqualTo("Hyderabad");
        assertThat(items.get(0).state()).isEqualTo("Telangana");

        // Pincode prefix search
        ResponseEntity<ApiResponse<List<LocationItem>>> pinRes =
                locationController.searchLocations("5300", "AP", 10);
        assertThat(pinRes.getBody()).isNotNull();
        assertThat(pinRes.getBody().getData()).isNotEmpty();
        assertThat(pinRes.getBody().getData().get(0).city()).isEqualTo("Visakhapatnam");
    }

    @Test
    @DisplayName("Canonical ID lookup retrieves valid location metadata")
    void testLocationByIdLookup() {
        ResponseEntity<ApiResponse<LocationNode>> nodeRes =
                locationController.getLocationById("in-ts-hyd-city");
        assertThat(nodeRes.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(nodeRes.getBody()).isNotNull();
        assertThat(nodeRes.getBody().getData().name()).isEqualTo("Hyderabad");
        assertThat(nodeRes.getBody().getData().stateCode()).isEqualTo("TS");
    }

    @Test
    @DisplayName("Hyderabad localities must NEVER be classified as cities")
    void testLocalitiesAreNotCities() {
        List<String> prohibitedAsCities = List.of(
                "Gachibowli", "Madhapur", "Kondapur", "Kukatpally",
                "Jubilee Hills", "Banjara Hills", "Miyapur"
        );

        List<LocationNode> tsCities = locationService.getCitiesByStateNode("Telangana");
        List<String> tsCityNames = tsCities.stream()
                .filter(n -> "CITY".equals(n.type()))
                .map(LocationNode::name)
                .toList();

        for (String locality : prohibitedAsCities) {
            assertThat(tsCityNames)
                    .as("Locality %s must NOT be classified as a CITY", locality)
                    .doesNotContain(locality);
        }
    }

    @Test
    @DisplayName("State isolation: Hyderabad must never appear under Andhra Pradesh")
    void testCrossStateIsolation() {
        List<LocationNode> apDistricts = locationService.getDistrictsByState("in-ap");
        List<String> apDistrictNames = apDistricts.stream().map(LocationNode::name).toList();
        assertThat(apDistrictNames).doesNotContain("Hyderabad");

        List<LocationNode> apCities = locationService.getCitiesByStateNode("in-ap");
        List<String> apCityNames = apCities.stream().map(LocationNode::name).toList();
        assertThat(apCityNames).doesNotContain("Hyderabad");
    }

    @Test
    @DisplayName("City localities and pincodes endpoints return correct hierarchy")
    void testCityLocalitiesAndPincodes() {
        ResponseEntity<ApiResponse<List<LocationItem>>> localitiesRes =
                locationController.getLocalitiesByCityId("Hyderabad");
        assertThat(localitiesRes.getStatusCode().is2xxSuccessful()).isTrue();
        assertThat(localitiesRes.getBody()).isNotNull();
        List<String> locNames = localitiesRes.getBody().getData().stream()
                .map(LocationItem::locality)
                .toList();
        assertThat(locNames).contains("Gachibowli", "Madhapur", "Kondapur", "Hitec City");
    }
}
