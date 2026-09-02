package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.Favorite;
import com.seedha.properties.repository.FavoriteRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/favorites")
public class FavoriteController {

    private final FavoriteRepository favoriteRepository;

    public FavoriteController(FavoriteRepository favoriteRepository) {
        this.favoriteRepository = favoriteRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Favorite>>> getFavorites(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        List<Favorite> favorites = favoriteRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(favorites));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ApiResponse<Map<String, Object>>> toggleFavorite(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        String propertyIdStr = payload.get("property_id");
        if (propertyIdStr == null || propertyIdStr.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("property_id is required"));
        }

        UUID propertyId = UUID.fromString(propertyIdStr);
        boolean exists = favoriteRepository.existsByUserIdAndPropertyId(currentUser.getId(), propertyId);

        if (exists) {
            favoriteRepository.deleteByUserIdAndPropertyId(currentUser.getId(), propertyId);
            return ResponseEntity.ok(ApiResponse.success(Map.of("favorited", false)));
        } else {
            favoriteRepository.save(new Favorite(currentUser.getId(), propertyId));
            return ResponseEntity.ok(ApiResponse.success(Map.of("favorited", true)));
        }
    }
}
