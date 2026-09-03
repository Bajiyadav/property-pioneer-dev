package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.service.LocationService;
import com.seedha.properties.service.LocationService.LocationItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST API for Indian Locality, City & Pincode Autocomplete.
 * Fully eliminates reliance on external Geoapify and Google Places APIs.
 */
@RestController
@RequestMapping("/api/v2/locations")
public class LocationController {

    private final LocationService locationService;

    public LocationController(LocationService locationService) {
        this.locationService = locationService;
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<ApiResponse<List<LocationItem>>> autocomplete(
            @RequestParam(name = "q", defaultValue = "") String query,
            @RequestParam(name = "limit", defaultValue = "8") int limit) {
        List<LocationItem> results = locationService.search(query, limit);
        return ResponseEntity.ok(ApiResponse.success(results, results.size()));
    }

    @GetMapping("/states")
    public ResponseEntity<ApiResponse<List<String>>> getStates() {
        List<String> states = locationService.getAllStates();
        return ResponseEntity.ok(ApiResponse.success(states, states.size()));
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
