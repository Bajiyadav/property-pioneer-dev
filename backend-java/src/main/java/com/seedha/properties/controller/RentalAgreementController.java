package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.RentalAgreement;
import com.seedha.properties.repository.RentalAgreementRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/rental-agreements")
public class RentalAgreementController {

    private final RentalAgreementRepository rentalAgreementRepository;

    public RentalAgreementController(RentalAgreementRepository rentalAgreementRepository) {
        this.rentalAgreementRepository = rentalAgreementRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RentalAgreement>>> getAgreements(
            @RequestParam(defaultValue = "owner") String role,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        List<RentalAgreement> list = "tenant".equalsIgnoreCase(role)
                ? rentalAgreementRepository.findByTenantIdOrderByCreatedAtDesc(currentUser.getId())
                : rentalAgreementRepository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId());

        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RentalAgreement>> getAgreementById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        RentalAgreement agreement = rentalAgreementRepository.findById(id).orElse(null);
        if (agreement == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Rental agreement not found"));
        }

        // Strict ownership check (only owner, tenant, or admin)
        boolean isOwner = agreement.getOwnerId() != null && agreement.getOwnerId().equals(currentUser.getId());
        boolean isTenant = agreement.getTenantId() != null && agreement.getTenantId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());

        if (!isOwner && !isTenant && !isAdmin) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: Access denied to this rental agreement"));
        }

        return ResponseEntity.ok(ApiResponse.success(agreement));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<RentalAgreement>> createAgreement(
            @RequestBody RentalAgreement agreement,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        // Server-enforced owner ID (Prevent client mass assignment / spoofing)
        agreement.setOwnerId(currentUser.getId());
        RentalAgreement saved = rentalAgreementRepository.save(agreement);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
