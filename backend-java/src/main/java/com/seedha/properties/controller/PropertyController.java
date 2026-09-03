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
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "stateName", required = false) String stateName,
            @RequestParam(name = "city", required = false) String city,
            @RequestParam(name = "cityName", required = false) String cityName,
            @RequestParam(name = "listing_type", required = false) String listingTypeSnake,
            @RequestParam(name = "listingType", required = false) String listingTypeCamel,
            @RequestParam(name = "property_type", required = false) String propertyTypeSnake,
            @RequestParam(name = "propertyType", required = false) String propertyTypeCamel,
            @RequestParam(name = "min_price", required = false) BigDecimal minPriceSnake,
            @RequestParam(name = "minPrice", required = false) BigDecimal minPriceCamel,
            @RequestParam(name = "max_price", required = false) BigDecimal maxPriceSnake,
            @RequestParam(name = "maxPrice", required = false) BigDecimal maxPriceCamel,
            @RequestParam(required = false) Integer bhk,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(name = "radius_km", required = false) Double radiusKm,
            @RequestParam(name = "radiusMeters", required = false) Double radiusMetersParam,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(defaultValue = "20") int limit) {

        String effectiveState = state != null ? state : stateName;
        String effectiveCity = city != null ? city : cityName;
        String effectiveListingType = listingTypeSnake != null ? listingTypeSnake : listingTypeCamel;
        String effectivePropertyType = propertyTypeSnake != null ? propertyTypeSnake : propertyTypeCamel;
        BigDecimal effectiveMinPrice = minPriceSnake != null ? minPriceSnake : minPriceCamel;
        BigDecimal effectiveMaxPrice = maxPriceSnake != null ? maxPriceSnake : maxPriceCamel;

        int pageIndex = Math.max(0, page - 1);
        int pageSize = Math.min(Math.max(1, limit), 50);

        Double radiusMeters = radiusMetersParam != null ? radiusMetersParam
                : (radiusKm != null ? radiusKm * 1000.0 : 10000.0);

        Page<Property> resultPage = propertyRepository.searchProperties(
                effectiveState, effectiveCity, effectiveListingType, effectivePropertyType,
                effectiveMinPrice, effectiveMaxPrice, bhk,
                lat, lng, radiusMeters, PageRequest.of(pageIndex, pageSize)
        );

        return ResponseEntity.ok(ApiResponse.success(resultPage.getContent(), resultPage.getTotalElements()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Property>> getPropertyById(@PathVariable UUID id) {
        return propertyRepository.findById(id)
                .map(p -> ResponseEntity.ok(ApiResponse.success(p)))
                .orElseGet(() -> ResponseEntity.status(404).body(ApiResponse.error("Property not found")));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Property>> createProperty(
            @RequestBody Property property,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return handleSaveProperty(property, currentUser);
    }

    @PostMapping("/manage")
    public ResponseEntity<ApiResponse<Property>> saveProperty(
            @RequestBody Property property,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return handleSaveProperty(property, currentUser);
    }

    private ResponseEntity<ApiResponse<Property>> handleSaveProperty(
            Property property,
            UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        // Enforce ownership if updating
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
