package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.HomeLoanEnquiry;
import com.seedha.properties.repository.HomeLoanRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/home-loans")
public class HomeLoanController {

    private final HomeLoanRepository homeLoanRepository;

    public HomeLoanController(HomeLoanRepository homeLoanRepository) {
        this.homeLoanRepository = homeLoanRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HomeLoanEnquiry>>> getHomeLoans(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        List<HomeLoanEnquiry> list = "ADMIN".equalsIgnoreCase(currentUser.getRole())
                ? homeLoanRepository.findAll()
                : homeLoanRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());

        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HomeLoanEnquiry>> getHomeLoanById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        HomeLoanEnquiry enquiry = homeLoanRepository.findById(id).orElse(null);
        if (enquiry == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Home loan enquiry not found"));
        }

        // Strict ownership check (only applicant or admin)
        boolean isApplicant = enquiry.getUserId() != null && enquiry.getUserId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());

        if (!isApplicant && !isAdmin) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: Access denied to this financial record"));
        }

        return ResponseEntity.ok(ApiResponse.success(enquiry));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HomeLoanEnquiry>> submitHomeLoan(
            @RequestBody HomeLoanEnquiry enquiry,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        // Server-enforced user ID (Prevent client spoofing another user)
        if (currentUser != null) {
            enquiry.setUserId(currentUser.getId());
        }

        HomeLoanEnquiry saved = homeLoanRepository.save(enquiry);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
