package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.HomeLoanEnquiry;
import com.seedha.properties.repository.HomeLoanRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/home-loans")
public class HomeLoanController {

    private final HomeLoanRepository homeLoanRepository;

    public HomeLoanController(HomeLoanRepository homeLoanRepository) {
        this.homeLoanRepository = homeLoanRepository;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<HomeLoanEnquiry>> submitHomeLoan(
            @RequestBody HomeLoanEnquiry enquiry,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser != null) {
            enquiry.setUserId(currentUser.getId());
        }

        HomeLoanEnquiry saved = homeLoanRepository.save(enquiry);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }
}
