package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.StoredFile;
import com.seedha.properties.repository.StoredFileRepository;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.FileSecurityValidator;
import com.seedha.properties.service.MalwareScanService;
import com.seedha.properties.service.SecurityAuditService;
import com.seedha.properties.service.StorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/files")
public class FileController {

    private final StorageService storageService;
    private final StoredFileRepository storedFileRepository;
    private final FileSecurityValidator fileValidator;
    private final SecurityAuditService auditService;
    private final MalwareScanService malwareScanService;
    private final boolean scanRequiredForPrivate;

    public FileController(StorageService storageService,
                          StoredFileRepository storedFileRepository,
                          FileSecurityValidator fileValidator,
                          SecurityAuditService auditService,
                          MalwareScanService malwareScanService,
                          @org.springframework.beans.factory.annotation.Value(
                                  "${seedha.files.scan.require-for-private:false}") boolean scanRequiredForPrivate) {
        this.storageService = storageService;
        this.storedFileRepository = storedFileRepository;
        this.fileValidator = fileValidator;
        this.auditService = auditService;
        this.malwareScanService = malwareScanService;
        this.scanRequiredForPrivate = scanRequiredForPrivate;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, Object>>> uploadDirect(
            @RequestParam("file") MultipartFile file,
            @RequestParam("folder") String folder,
            @RequestParam(value = "entity_id", required = false) UUID entityId,
            @RequestParam(value = "entity_type", required = false) String entityType,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("File is empty"));
        }

        try {
            // 1. Validate request parameters & extension/MIME
            fileValidator.validateUploadRequest(folder, file.getOriginalFilename(), file.getContentType(), file.getSize());

            // 2. Inspect Magic Bytes / Signature
            byte[] fileBytes = file.getBytes();
            fileValidator.validateMagicBytes(fileBytes, file.getContentType(), file.getOriginalFilename());

            // 3. Malware scan while the bytes are in hand. INFECTED is always
            //    rejected. When no scanner is reachable the file is recorded as
            //    PENDING; for private folders that is refused outright when
            //    scan enforcement is on, so a sensitive document is never
            //    trusted before it has been scanned.
            MalwareScanService.ScanResult scan = malwareScanService.scan(fileBytes);
            String scanStatus;
            switch (scan.verdict()) {
                case CLEAN -> scanStatus = "CLEAN";
                case INFECTED -> {
                    auditService.logSecurityEvent("FILE_MALWARE_DETECTED", currentUser.getId(), null, null,
                            String.format("{\"folder\":\"%s\",\"signature\":\"%s\"}",
                                    folder, scan.signature()));
                    return ResponseEntity.status(422)
                            .body(ApiResponse.error("File rejected: failed malware scan."));
                }
                default -> scanStatus = "PENDING";
            }

            // 4. Compute SHA-256 Checksum
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashBytes = digest.digest(fileBytes);
            String sha256 = HexFormat.of().formatHex(hashBytes);

            FileSecurityValidator.FolderRule rule = fileValidator.getRule(folder);
            boolean isPrivate = rule.isPrivate();

            if (isPrivate && scanRequiredForPrivate && !"CLEAN".equals(scanStatus)) {
                auditService.logSecurityEvent("FILE_SCAN_UNAVAILABLE_BLOCKED", currentUser.getId(), null, null,
                        String.format("{\"folder\":\"%s\"}", folder));
                return ResponseEntity.status(503)
                        .body(ApiResponse.error("Uploads are temporarily unavailable: document scanning is offline."));
            }
            String objectKey = fileValidator.generateSafeObjectKey(folder, currentUser.getId(), file.getOriginalFilename(), entityId);

            // 5. Save metadata
            StoredFile storedFile = new StoredFile(
                    currentUser.getId(),
                    folder.toLowerCase(),
                    file.getOriginalFilename(),
                    objectKey,
                    file.getContentType(),
                    file.getSize(),
                    isPrivate,
                    entityType != null ? entityType : folder,
                    entityId,
                    sha256
            );
            storedFile.setScanStatus(scanStatus);
            if ("CLEAN".equals(scanStatus)) {
                storedFile.setScannedAt(java.time.OffsetDateTime.now());
            }
            StoredFile saved = storedFileRepository.save(storedFile);

            auditService.logSecurityEvent("FILE_DIRECT_UPLOAD_SUCCESS", currentUser.getId(), null, null,
                    String.format("{\"file_id\":\"%s\",\"object_key\":\"%s\",\"size\":%d}", saved.getId(), objectKey, file.getSize()));

            return ResponseEntity.ok(ApiResponse.success(Map.of(
                    "file_id", saved.getId(),
                    "object_key", objectKey,
                    "content_type", file.getContentType(),
                    "size_bytes", file.getSize(),
                    "is_private", isPrivate,
                    "checksum_sha256", sha256
            )));
        } catch (AccessDeniedException ex) {
            return ResponseEntity.status(403).body(ApiResponse.error(ex.getMessage()));
        } catch (SecurityException | IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body(ApiResponse.error("File processing failed: " + ex.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StoredFile>> getFileMetadata(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        Optional<StoredFile> fileOpt = storedFileRepository.findById(id);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.error("File not found"));
        }

        StoredFile file = fileOpt.get();
        boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
        if (file.isPrivate() && !file.getOwnerId().equals(currentUser.getId()) && !isAdmin) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: You are not authorized to view this file metadata"));
        }

        return ResponseEntity.ok(ApiResponse.success(file));
    }

    @GetMapping("/my-files")
    public ResponseEntity<ApiResponse<List<StoredFile>>> getMyFiles(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        List<StoredFile> files = storedFileRepository.findByOwnerIdOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(files));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, String>>> deleteFileById(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Authentication required"));
        }

        Optional<StoredFile> fileOpt = storedFileRepository.findById(id);
        if (fileOpt.isEmpty()) {
            return ResponseEntity.status(404).body(ApiResponse.error("File not found"));
        }

        StoredFile file = fileOpt.get();
        boolean isAdmin = "admin".equalsIgnoreCase(currentUser.getRole());
        if (!file.getOwnerId().equals(currentUser.getId()) && !isAdmin) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: You do not own this file"));
        }

        storageService.deleteFile(file.getObjectKey(), currentUser.getId(), isAdmin);
        return ResponseEntity.ok(ApiResponse.success(Map.of("message", "File deleted successfully")));
    }
}
