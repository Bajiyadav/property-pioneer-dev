package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.SiteVisit;
import com.seedha.properties.repository.SiteVisitRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping({"/api/v2/visits", "/api/v2/site-visits"})
public class SiteVisitController {

    private final SiteVisitRepository siteVisitRepository;

    public SiteVisitController(SiteVisitRepository siteVisitRepository) {
        this.siteVisitRepository = siteVisitRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SiteVisit>>> getVisits(
            @RequestParam(defaultValue = "seeker") String role,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        List<SiteVisit> list = "owner".equalsIgnoreCase(role)
                ? siteVisitRepository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId())
                : siteVisitRepository.findBySeekerIdOrderByCreatedAtDesc(currentUser.getId());

        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SiteVisit>> scheduleVisit(
            @RequestBody SiteVisit visit,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        visit.setSeekerId(currentUser.getId());
        SiteVisit saved = siteVisitRepository.save(visit);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<SiteVisit>> updateVisitStatus(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        String visitIdStr = (String) payload.get("id");
        String status = (String) payload.get("status");

        if (visitIdStr == null || status == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("id and status are required"));
        }

        UUID visitId = UUID.fromString(visitIdStr);
        SiteVisit visit = siteVisitRepository.findById(visitId).orElse(null);
        if (visit == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("Site visit not found"));
        }

        // Ownership verification (only owner, seeker, or admin can update status)
        if (!visit.getOwnerId().equals(currentUser.getId()) && !visit.getSeekerId().equals(currentUser.getId()) && !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden"));
        }

        visit.setStatus(status.toUpperCase());
        SiteVisit updated = siteVisitRepository.save(visit);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }
}
