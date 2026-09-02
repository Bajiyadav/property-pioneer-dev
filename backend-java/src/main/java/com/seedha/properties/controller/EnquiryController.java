package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.Enquiry;
import com.seedha.properties.repository.EnquiryRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/enquiries")
public class EnquiryController {

    private final EnquiryRepository enquiryRepository;

    public EnquiryController(EnquiryRepository enquiryRepository) {
        this.enquiryRepository = enquiryRepository;
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

    @PostMapping
    public ResponseEntity<ApiResponse<Enquiry>> createEnquiry(
            @RequestBody Enquiry enquiry,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        enquiry.setSeekerId(currentUser.getId());
        Enquiry saved = enquiryRepository.save(enquiry);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
