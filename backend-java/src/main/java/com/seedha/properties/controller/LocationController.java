package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.service.LocationService;
import com.seedha.properties.service.LocationService.LocationItem;
import com.seedha.properties.service.LocationService.LocationNode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

/**
 * Authoritative REST API for Pan-India Location Hierarchy & Autocomplete.
 *
 * Exposes:
 * - GET /api/v2/locations/states
 * - GET /api/v2/locations/states/{stateId}/districts
 * - GET /api/v2/locations/districts/{districtId}/cities
 * - GET /api/v2/locations/cities/{cityId}/localities
 * - GET /api/v2/locations/search?q={query}&state={state}&limit={limit}
 * - GET /api/v2/locations/{id}
 *
 * Fully replaces third-party Google Places & Geoapify APIs with internal
 * database-backed and in-memory indexed matching.
 */
@RestController
@RequestMapping("/api/v2/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    /**
     * Get all 28 Indian States and 8 Union Territories.
     */
    @GetMapping("/states")
    public ResponseEntity<ApiResponse<List<LocationNode>>> getStates() {
        List<LocationNode> states = locationService.getStates();
        return ResponseEntity.ok(ApiResponse.success(states, states.size()));
    }

    /**
     * Get all official districts for a given state (by ID, Name, or State Code).
     */
    @GetMapping("/states/{stateId}/districts")
    public ResponseEntity<ApiResponse<List<LocationNode>>> getDistricts(
            @PathVariable String stateId) {
        List<LocationNode> districts = locationService.getDistrictsByState(stateId);
        return ResponseEntity.ok(ApiResponse.success(districts, districts.size()));
    }

    /**
     * Get all recognized cities/towns in a state (across all its districts).
     */
    @GetMapping("/states/{stateId}/cities")
    public ResponseEntity<ApiResponse<List<LocationNode>>> getCitiesByState(
            @PathVariable String stateId) {
        List<LocationNode> cities = locationService.getCitiesByStateNode(stateId);
        return ResponseEntity.ok(ApiResponse.success(cities, cities.size()));
    }

    /**
     * Get all recognized cities/towns in a district.
     */
    @GetMapping("/districts/{districtId}/cities")
    public ResponseEntity<ApiResponse<List<LocationNode>>> getCitiesByDistrict(
            @PathVariable String districtId) {
        List<LocationNode> cities = locationService.getCitiesByDistrict(districtId);
        return ResponseEntity.ok(ApiResponse.success(cities, cities.size()));
    }

    /**
     * Get localities in a city.
     */
    @GetMapping("/cities/{cityId}/localities")
    public ResponseEntity<ApiResponse<List<LocationItem>>> getLocalitiesByCityId(
            @PathVariable String cityId) {
        List<LocationItem> localities = locationService.getLocalitiesByCity(cityId);
        return ResponseEntity.ok(ApiResponse.success(localities, localities.size()));
    }

    /**
     * Get official PIN codes associated with a city/town.
     */
    @GetMapping("/cities/{cityId}/pincodes")
    public ResponseEntity<ApiResponse<List<LocationNode>>> getCityPincodes(
            @PathVariable String cityId) {
        List<LocationNode> pincodes = locationService.getPincodesByCity(cityId);
        return ResponseEntity.ok(ApiResponse.success(pincodes, pincodes.size()));
    }

    /**
     * Lookup location details by canonical 6-digit PIN code.
     */
    @GetMapping("/pincodes/{pincode}")
    public ResponseEntity<ApiResponse<LocationNode>> getPincodeDetails(
            @PathVariable String pincode) {
        Optional<LocationNode> pinNode = locationService.getPincode(pincode);
        if (pinNode.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.error("PIN code not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(pinNode.get()));
    }

    /**
     * Natural search & autocomplete across states, cities, towns, and localities.
     */
    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<LocationItem>>> searchLocations(
            @RequestParam(name = "q", defaultValue = "") String query,
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "limit", defaultValue = "10") int limit) {
        List<LocationItem> results = locationService.search(query, state, limit);
        return ResponseEntity.ok(ApiResponse.success(results, results.size()));
    }

    /**
     * Lookup a single location by canonical ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<LocationNode>> getLocationById(
            @PathVariable String id) {
        Optional<LocationNode> node = locationService.getLocationById(id);
        if (node.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.error("Location not found"));
        }
        return ResponseEntity.ok(ApiResponse.success(node.get()));
    }

    // =========================================================================
    // BACKWARD COMPATIBILITY ENDPOINTS (PRESERVED)
    // =========================================================================

    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<LocationItem>>> autocomplete(
            @RequestParam(name = "q", defaultValue = "") String query,
            @RequestParam(name = "limit", defaultValue = "8") int limit) {
        List<LocationItem> results = locationService.search(query, limit);
        return ResponseEntity.ok(ApiResponse.success(results, results.size()));
    }

    @GetMapping("/cities")
    public ResponseEntity<ApiResponse<List<String>>> getCities(
            @RequestParam(name = "state", required = false) String state) {
        List<String> cities = locationService.getCitiesByState(state);
        return ResponseEntity.ok(ApiResponse.success(cities, cities.size()));
    }

    @GetMapping("/localities")
    public ResponseEntity<ApiResponse<List<LocationItem>>> getLocalities(
            @RequestParam(name = "city") String city) {
        List<LocationItem> localities = locationService.getLocalitiesByCity(city);
        return ResponseEntity.ok(ApiResponse.success(localities, localities.size()));
    }
}
