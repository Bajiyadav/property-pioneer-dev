package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.Property;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/properties")
public class PropertyController {

    private final PropertyRepository propertyRepository;

    public PropertyController(PropertyRepository propertyRepository) {
        this.propertyRepository = propertyRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Property>>> searchProperties(
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String city,
            @RequestParam(name = "listing_type", required = false) String listingType,
            @RequestParam(name = "property_type", required = false) String propertyType,
            @RequestParam(name = "min_price", required = false) BigDecimal minPrice,
            @RequestParam(name = "max_price", required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer bhk,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(name = "radius_km", defaultValue = "10.0") Double radiusKm,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        int pageIndex = Math.max(0, page - 1);
        int pageSize = Math.min(Math.max(1, limit), 50);

        Double radiusMeters = radiusKm != null ? radiusKm * 1000.0 : 10000.0;

        Page<Property> resultPage = propertyRepository.searchProperties(
                state, city, listingType, propertyType, minPrice, maxPrice, bhk,
                lat, lng, radiusMeters, PageRequest.of(pageIndex, pageSize)
        );

        return ResponseEntity.ok(ApiResponse.success(resultPage.getContent(), resultPage.getTotalElements()));
    }

    @PostMapping("/manage")
    public ResponseEntity<ApiResponse<Property>> saveProperty(
            @RequestBody Property property,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        // Enforce ownership
        if (property.getId() != null) {
            Property existing = propertyRepository.findById(property.getId()).orElse(null);
            if (existing == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("Property not found"));
            }
            if (!existing.getOwnerId().equals(currentUser.getId()) && !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
                return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: You do not own this property"));
            }
        }

        property.setOwnerId(currentUser.getId());
        Property saved = propertyRepository.save(property);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
