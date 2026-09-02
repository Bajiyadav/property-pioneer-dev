package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.RentalAgreement;
import com.seedha.properties.repository.RentalAgreementRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

    @PostMapping
    public ResponseEntity<ApiResponse<RentalAgreement>> createAgreement(
            @RequestBody RentalAgreement agreement,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        agreement.setOwnerId(currentUser.getId());
        RentalAgreement saved = rentalAgreementRepository.save(agreement);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
