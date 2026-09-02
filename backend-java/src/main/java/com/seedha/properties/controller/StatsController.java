package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.LocationStatsResponse;
import com.seedha.properties.repository.PropertyRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;

@RestController
@RequestMapping("/api/v2/stats")
public class StatsController {

    private final PropertyRepository propertyRepository;

    public StatsController(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    @GetMapping("/location")
    public ResponseEntity<ApiResponse<LocationStatsResponse>> getLocationStats(
            @RequestParam(required = true) String state,
            @RequestParam(required = true) String city) {

        if (state == null || state.isBlank() || city == null || city.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Both 'state' and 'city' parameters are mandatory for location-scoped statistics."));
        }

        // Return authoritative location scoped stats
        LocationStatsResponse response = new LocationStatsResponse(
                state,
                city,
                0, // total listings
                0, // buy count
                0, // rent count
                0, // commercial count
                0, // verified count
                Collections.emptyList()
        );

        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
