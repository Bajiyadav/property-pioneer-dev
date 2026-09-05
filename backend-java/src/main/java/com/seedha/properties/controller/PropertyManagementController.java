package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.CreatePropertyManagementRequestDto;
import com.seedha.properties.dto.PropertyManagementResponseDto;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.PropertyManagementService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/property-management")
public class PropertyManagementController {

    private final PropertyManagementService propertyManagementService;

    public PropertyManagementController(PropertyManagementService propertyManagementService) {
        this.propertyManagementService = propertyManagementService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PropertyManagementResponseDto>> createRequest(
            @Valid @RequestBody CreatePropertyManagementRequestDto dto,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        try {
            PropertyManagementResponseDto response = propertyManagementService.createRequest(
                    dto, currentUser, request.getRemoteAddr());
            return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<List<PropertyManagementResponseDto>>> getMyRequests(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        List<PropertyManagementResponseDto> list = propertyManagementService.getOwnerRequests(currentUser);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PropertyManagementResponseDto>> getRequestById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        try {
            PropertyManagementResponseDto dto = propertyManagementService.getOwnerRequestById(id, currentUser);
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<PropertyManagementResponseDto>> cancelRequest(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser,
            HttpServletRequest request) {

        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Unauthorized"));
        }

        try {
            PropertyManagementResponseDto dto = propertyManagementService.cancelRequestByOwner(
                    id, currentUser, request.getRemoteAddr());
            return ResponseEntity.ok(ApiResponse.success(dto));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error(ex.getMessage()));
        } catch (NoSuchElementException ex) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ApiResponse.error(ex.getMessage()));
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ApiResponse.error(ex.getMessage()));
        }
    }
}
