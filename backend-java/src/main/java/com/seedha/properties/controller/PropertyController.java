package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.PropertyWriteRequest;
import com.seedha.properties.entity.Property;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import jakarta.validation.Valid;
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
    public ResponseEntity<ApiResponse<Property>> getPropertyById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        Property property = propertyRepository.findById(id).orElse(null);
        if (property == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Property not found"));
        }

        // An unapproved listing is visible to its owner and to admins only. It used
        // to be readable by anyone holding the id, which exposed listings that
        // moderation had not passed — and rejected ones.
        if (!Boolean.TRUE.equals(property.getIsVerified()) && !maySeeUnpublished(property, currentUser)) {
            return ResponseEntity.status(404).body(ApiResponse.error("Property not found"));
        }

        return ResponseEntity.ok(ApiResponse.success(property));
    }

    private boolean maySeeUnpublished(Property property, UserPrincipal currentUser) {
        if (currentUser == null) return false;
        if ("ADMIN".equalsIgnoreCase(currentUser.getRole())) return true;
        return property.getOwnerId() != null && property.getOwnerId().equals(currentUser.getId());
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Property>> createProperty(
            @Valid @RequestBody PropertyWriteRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return handleSaveProperty(request, currentUser);
    }

    @PostMapping("/manage")
    public ResponseEntity<ApiResponse<Property>> saveProperty(
            @Valid @RequestBody PropertyWriteRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return handleSaveProperty(request, currentUser);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteProperty(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Property existing = propertyRepository.findById(id).orElse(null);
        if (existing == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Property not found"));
        }

        // Strict ownership check (or ADMIN)
        if (!existing.getOwnerId().equals(currentUser.getId()) && !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: You do not own this property"));
        }

        propertyRepository.delete(existing);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    /**
     * Creates or updates a listing from the client-writable field set only.
     *
     * Trust state — {@code status}, {@code isVerified}, {@code isFeatured},
     * {@code viewCount}, {@code ownerId} — is never read from the request. On an
     * update the fields are copied onto the loaded row, so an omitted field keeps
     * its stored value instead of being blanked, and moderation state survives the
     * edit.
     */
    private ResponseEntity<ApiResponse<Property>> handleSaveProperty(
            PropertyWriteRequest request,
            UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Property property;
        if (request.getId() != null) {
            Property existing = propertyRepository.findById(request.getId()).orElse(null);
            if (existing == null) {
                return ResponseEntity.status(404).body(ApiResponse.error("Property not found"));
            }
            boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());
            if (!currentUser.getId().equals(existing.getOwnerId()) && !isAdmin) {
                return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: You do not own this property"));
            }
            // An admin edit must not silently transfer the listing to the admin,
            // which is what unconditionally stamping the caller's id used to do.
            property = existing;
        } else {
            property = new Property();
            property.setOwnerId(currentUser.getId());
        }

        applyWritableFields(property, request);
        Property saved = propertyRepository.save(property);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    private void applyWritableFields(Property target, PropertyWriteRequest src) {
        target.setTitle(src.getTitle());
        if (src.getDescription() != null) target.setDescription(src.getDescription());
        target.setListingType(src.getListingType());
        target.setPropertyType(src.getPropertyType());
        target.setPrice(src.getPrice());
        if (src.getSecurityDeposit() != null) target.setSecurityDeposit(src.getSecurityDeposit());
        if (src.getMaintenanceCharges() != null) target.setMaintenanceCharges(src.getMaintenanceCharges());
        if (src.getBhk() != null) target.setBhk(src.getBhk());
        if (src.getBathrooms() != null) target.setBathrooms(src.getBathrooms());
        if (src.getBuiltupAreaSqft() != null) target.setBuiltupAreaSqft(src.getBuiltupAreaSqft());
        if (src.getFurnishingStatus() != null) target.setFurnishingStatus(src.getFurnishingStatus());
        target.setStateName(src.getStateName());
        target.setCityName(src.getCityName());
        if (src.getLocality() != null) target.setLocality(src.getLocality());
        if (src.getAddress() != null) target.setAddress(src.getAddress());
        if (src.getPincode() != null) target.setPincode(src.getPincode());
        if (src.getLatitude() != null) target.setLatitude(src.getLatitude());
        if (src.getLongitude() != null) target.setLongitude(src.getLongitude());
    }
}
