package com.seedha.properties.controller;

import com.seedha.properties.dto.*;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.PropertyManagementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/admin/property-management")
public class AdminPropertyManagementController {

    private final PropertyManagementService propertyManagementService;

    public AdminPropertyManagementController(PropertyManagementService propertyManagementService) {
        this.propertyManagementService = propertyManagementService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminPropertyManagementResponseDto>>> getAllRequests(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: Admin access required"));
        }

        Page<AdminPropertyManagementResponseDto> result = propertyManagementService.getAllRequestsForAdmin(
                status, page, size, currentUser);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<PropertyManagementStatsDto>> getStats(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: Admin access required"));
        }

        PropertyManagementStatsDto stats = propertyManagementService.getManagementStats(currentUser);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AdminPropertyManagementResponseDto>> getRequestById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: Admin access required"));
        }

        try {
            AdminPropertyManagementResponseDto dto = propertyManagementService.getAdminRequestById(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<AdminPropertyManagementResponseDto>> updateStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateManagementStatusRequestDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {

        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: Admin access required"));
        }

        try {
            AdminPropertyManagementResponseDto updated = propertyManagementService.updateStatusByAdmin(
                    id, dto, currentUser, request.getRemoteAddr());
            return ResponseEntity.ok(ApiResponse.success(updated));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<List<InternalNoteResponseDto>>> getInternalNotes(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: Admin access required"));
        }

        try {
            List<InternalNoteResponseDto> notes = propertyManagementService.getInternalNotes(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success(notes));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/notes")
    public ResponseEntity<ApiResponse<InternalNoteResponseDto>> addInternalNote(
            @PathVariable UUID id,
            @Valid @RequestBody CreateInternalNoteRequestDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {

        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Forbidden: Admin access required"));
        }

        try {
            InternalNoteResponseDto note = propertyManagementService.addInternalNote(
                    id, dto, currentUser, request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(note));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        }
    }
}
