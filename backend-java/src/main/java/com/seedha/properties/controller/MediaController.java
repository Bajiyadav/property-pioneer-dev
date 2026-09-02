package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.PresignUploadRequest;
import com.seedha.properties.dto.PresignUploadResponse;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.StorageService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
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

        PresignUploadResponse response = storageService.createUploadUrl(request, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/presign-download")
    public ResponseEntity<ApiResponse<Map<String, String>>> getPresignDownloadUrl(
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        String objectKey = payload.get("object_key");
        if (objectKey == null || objectKey.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("object_key is required"));
        }

        String downloadUrl = storageService.createDownloadUrl(objectKey, currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(Map.of("download_url", downloadUrl)));
    }
}
