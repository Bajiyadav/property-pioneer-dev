package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.PresignUploadRequest;
import com.seedha.properties.dto.PresignUploadResponse;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.StorageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/media")
public class MediaController {

    private final StorageService storageService;

    public MediaController(StorageService storageService) {
        this.storageService = storageService;
    }

    @PostMapping("/presign-upload")
    public ResponseEntity<ApiResponse<PresignUploadResponse>> getPresignUploadUrl(
            @Valid @RequestBody PresignUploadRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        try {
            boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
            PresignUploadResponse response = storageService.createUploadUrl(request, currentUser.getId(), isAdmin);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(403).body(ApiResponse.error(ex.getMessage()));
        } catch (SecurityException | IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/presign-download")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getPresignDownloadUrl(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        String objectKey = payload.get("object_key");
        if (objectKey == null || objectKey.isBlank()) {
            objectKey = payload.get("objectKey");
        }

        if (objectKey == null || objectKey.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("object_key is required"));
        }

        try {
            boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
            String downloadUrl = storageService.createDownloadUrl(objectKey, currentUser.getId(), isAdmin);
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "download_url", downloadUrl,
                    "downloadUrl", downloadUrl,
                    "expires_in_seconds", 300
            )));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(403).body(ApiResponse.error(ex.getMessage()));
        } catch (SecurityException | IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @DeleteMapping("/files")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteFile(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        String objectKey = payload.get("object_key");
        if (objectKey == null || objectKey.isBlank()) {
            objectKey = payload.get("objectKey");
        }

        if (objectKey == null || objectKey.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("object_key is required"));
        }

        try {
            boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
            storageService.deleteFile(objectKey, currentUser.getId(), isAdmin);
            return ResponseEntity.ok(ApiResponse.success(Map.of("message", "File deleted successfully")));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(403).body(ApiResponse.error(ex.getMessage()));
        } catch (SecurityException | IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }
}
