package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.Enquiry;
import com.seedha.properties.entity.Property;
import com.seedha.properties.repository.EnquiryRepository;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/enquiries")
public class EnquiryController {

    private final EnquiryRepository enquiryRepository;
    private final PropertyRepository propertyRepository;

    public EnquiryController(EnquiryRepository enquiryRepository, PropertyRepository propertyRepository) {
        this.enquiryRepository = enquiryRepository;
        this.propertyRepository = propertyRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Enquiry>>> getEnquiries(
            @RequestParam(defaultValue = "seeker") String role,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        List<Enquiry> list = "owner".equalsIgnoreCase(role)
                ? enquiryRepository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId())
                : enquiryRepository.findBySeekerIdOrderByCreatedAtDesc(currentUser.getId());

        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Enquiry>> getEnquiryById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        Enquiry enquiry = enquiryRepository.findById(id).orElse(null);
        if (enquiry == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Enquiry not found"));
        }

        // Strict ownership check (only seeker, owner, or admin)
        boolean isSeeker = enquiry.getSeekerId() != null && enquiry.getSeekerId().equals(currentUser.getId());
        boolean isOwner = enquiry.getOwnerId() != null && enquiry.getOwnerId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());

        if (!isSeeker && !isOwner && !isAdmin) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: Access denied to this enquiry"));
        }

        return ResponseEntity.ok(ApiResponse.success(enquiry));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Enquiry>> createEnquiry(
            @RequestBody Enquiry enquiry,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        // Server-enforced seeker ID
        enquiry.setSeekerId(currentUser.getId());

        // Set ownerId from property lookup to prevent spoofing
        if (enquiry.getPropertyId() != null) {
            Property property = propertyRepository.findById(enquiry.getPropertyId()).orElse(null);
            if (property != null) {
                enquiry.setOwnerId(property.getOwnerId());
            }
        }

        Enquiry saved = enquiryRepository.save(enquiry);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
