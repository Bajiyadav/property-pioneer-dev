package com.seedha.properties.service;

import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.util.*;

@Component
public class FileSecurityValidator {

    public static class FolderRule {
        private final Set<String> allowedMimes;
        private final Set<String> allowedExtensions;
        private final long maxSizeBytes;
        private final boolean isPrivate;

        public FolderRule(Set<String> allowedMimes, Set<String> allowedExtensions, long maxSizeBytes, boolean isPrivate) {
            this.allowedMimes = allowedMimes;
            this.allowedExtensions = allowedExtensions;
            this.maxSizeBytes = maxSizeBytes;
            this.isPrivate = isPrivate;
        }

        public Set<String> getAllowedMimes() { return allowedMimes; }
        public Set<String> getAllowedExtensions() { return allowedExtensions; }
        public long getMaxSizeBytes() { return maxSizeBytes; }
        public boolean isPrivate() { return isPrivate; }
    }

    private static final Map<String, FolderRule> FOLDER_RULES = new HashMap<>();

    static {
        // Property Photos (Public, max 10MB)
        FOLDER_RULES.put("property-photos", new FolderRule(
                Set.of("image/jpeg", "image/png", "image/webp"),
                Set.of("jpg", "jpeg", "png", "webp"),
                10 * 1024 * 1024L,
                false
        ));
        // Property Videos (Public, max 50MB)
        FOLDER_RULES.put("property-videos", new FolderRule(
                Set.of("video/mp4", "video/webm"),
                Set.of("mp4", "webm"),
                50 * 1024 * 1024L,
                false
        ));
        // KYC Documents (Private, max 10MB)
        FOLDER_RULES.put("kyc-documents", new FolderRule(
                Set.of("image/jpeg", "image/png", "image/webp", "application/pdf"),
                Set.of("jpg", "jpeg", "png", "webp", "pdf"),
                10 * 1024 * 1024L,
                true
        ));
        // Rental Agreements (Private, max 15MB)
        FOLDER_RULES.put("rental-agreements", new FolderRule(
                Set.of("application/pdf"),
                Set.of("pdf"),
                15 * 1024 * 1024L,
                true
        ));
        // Home Loan & Supporting Documents (Private, max 15MB)
        FOLDER_RULES.put("home-loan-documents", new FolderRule(
                Set.of("application/pdf", "image/jpeg", "image/png"),
                Set.of("pdf", "jpg", "jpeg", "png"),
                15 * 1024 * 1024L,
                true
        ));
        FOLDER_RULES.put("supporting-documents", new FolderRule(
                Set.of("application/pdf", "image/jpeg", "image/png"),
                Set.of("pdf", "jpg", "jpeg", "png"),
                15 * 1024 * 1024L,
                true
        ));
        // User Avatars (Public, max 5MB)
        FOLDER_RULES.put("user-avatars", new FolderRule(
                Set.of("image/jpeg", "image/png", "image/webp"),
                Set.of("jpg", "jpeg", "png", "webp"),
                5 * 1024 * 1024L,
                false
        ));
    }

    private static final Set<String> DANGEROUS_EXTENSIONS = Set.of(
            "exe", "dll", "bat", "cmd", "sh", "bash", "php", "phtml", "php3", "php4", "php5",
            "js", "mjs", "ts", "html", "htm", "shtml", "jsp", "jspx", "jar", "war", "ear",
            "py", "pyc", "rb", "pl", "cgi", "vbs", "ps1", "svg", "asp", "aspx"
    );

    public FolderRule getRule(String folder) {
        if (folder == null) return null;
        return FOLDER_RULES.get(folder.trim().toLowerCase());
    }

    public void validateUploadRequest(String folder, String rawFileName, String declaredMime, long fileSizeBytes) {
        if (folder == null || folder.isBlank()) {
            throw new IllegalArgumentException("Folder category is required");
        }

        FolderRule rule = getRule(folder);
        if (rule == null) {
            throw new IllegalArgumentException("Invalid upload folder category: '" + folder + "'");
        }

        if (rawFileName == null || rawFileName.isBlank()) {
            throw new IllegalArgumentException("Filename is required");
        }

        // 1. Path Traversal & dangerous filename character check
        if (rawFileName.contains("..") || rawFileName.contains("/") || rawFileName.contains("\\") || rawFileName.contains("\0")) {
            throw new SecurityException("Filename contains invalid path traversal characters");
        }

        // 2. Extension validation
        String ext = extractCleanExtension(rawFileName);
        if (DANGEROUS_EXTENSIONS.contains(ext)) {
            throw new SecurityException("Forbidden file extension: '." + ext + "' is not permitted");
        }

        if (!rule.getAllowedExtensions().contains(ext)) {
            throw new IllegalArgumentException("File extension '." + ext + "' is not allowed for folder '" + folder +
                    "'. Allowed: " + rule.getAllowedExtensions());
        }

        // 3. MIME type validation
        if (declaredMime == null || declaredMime.isBlank()) {
            throw new IllegalArgumentException("Content-Type is required");
        }
        String normalizedMime = declaredMime.trim().toLowerCase();
        if (!rule.getAllowedMimes().contains(normalizedMime)) {
            throw new IllegalArgumentException("Content-Type '" + declaredMime + "' is not allowed for folder '" + folder +
                    "'. Allowed: " + rule.getAllowedMimes());
        }

        // 4. File Size validation
        if (fileSizeBytes <= 0) {
            throw new IllegalArgumentException("File is empty or invalid size");
        }
        if (fileSizeBytes > rule.getMaxSizeBytes()) {
            long maxMb = rule.getMaxSizeBytes() / (1024 * 1024);
            throw new IllegalArgumentException("File size exceeds maximum allowed limit of " + maxMb + " MB");
        }
    }

    /**
     * Inspects magic bytes / file signatures to detect MIME spoofing (e.g. executable disguised as .png).
     */
    public void validateMagicBytes(byte[] fileBytes, String declaredMime, String fileName) {
        if (fileBytes == null || fileBytes.length == 0) {
            throw new IllegalArgumentException("File payload is empty");
        }

        String ext = extractCleanExtension(fileName);

        if ("application/pdf".equalsIgnoreCase(declaredMime) || "pdf".equalsIgnoreCase(ext)) {
            // PDF Magic bytes: 25 50 44 46 (%PDF-)
            if (fileBytes.length < 4 || fileBytes[0] != 0x25 || fileBytes[1] != 0x50 || fileBytes[2] != 0x44 || fileBytes[3] != 0x46) {
                throw new SecurityException("File content does not match a valid PDF signature");
            }
            return;
        }

        if ("image/jpeg".equalsIgnoreCase(declaredMime) || "jpg".equalsIgnoreCase(ext) || "jpeg".equalsIgnoreCase(ext)) {
            // JPEG Magic bytes: FF D8 FF
            if (fileBytes.length < 3 || (fileBytes[0] & 0xFF) != 0xFF || (fileBytes[1] & 0xFF) != 0xD8 || (fileBytes[2] & 0xFF) != 0xFF) {
                throw new SecurityException("File content does not match a valid JPEG image signature");
            }
            return;
        }

        if ("image/png".equalsIgnoreCase(declaredMime) || "png".equalsIgnoreCase(ext)) {
            // PNG Magic bytes: 89 50 4E 47 0D 0A 1A 0A
            if (fileBytes.length < 8 || (fileBytes[0] & 0xFF) != 0x89 || fileBytes[1] != 0x50 || fileBytes[2] != 0x4E || fileBytes[3] != 0x47) {
                throw new SecurityException("File content does not match a valid PNG image signature");
            }
            return;
        }

        if ("image/webp".equalsIgnoreCase(declaredMime) || "webp".equalsIgnoreCase(ext)) {
            // WebP Magic bytes: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
            if (fileBytes.length < 12 || fileBytes[0] != 'R' || fileBytes[1] != 'I' || fileBytes[2] != 'F' || fileBytes[3] != 'F'
                    || fileBytes[8] != 'W' || fileBytes[9] != 'E' || fileBytes[10] != 'B' || fileBytes[11] != 'P') {
                throw new SecurityException("File content does not match a valid WebP image signature");
            }
            return;
        }

        if ("video/mp4".equalsIgnoreCase(declaredMime) || "mp4".equalsIgnoreCase(ext)) {
            // MP4 header contains 'ftyp' at bytes 4..7
            if (fileBytes.length >= 8) {
                String boxType = new String(fileBytes, 4, 4);
                if (!"ftyp".equals(boxType)) {
                    throw new SecurityException("File content does not match a valid MP4 video container");
                }
            }
            return;
        }
    }

    public String generateSafeObjectKey(String folder, UUID userId, String originalFileName, UUID entityId) {
        String cleanExt = extractCleanExtension(originalFileName);
        String safeFolder = folder.trim().toLowerCase();
        UUID uniqueFileId = UUID.randomUUID();

        if (entityId != null) {
            return String.format("%s/%s/%s/%s.%s", safeFolder, userId, entityId, uniqueFileId, cleanExt);
        }
        return String.format("%s/%s/%s.%s", safeFolder, userId, uniqueFileId, cleanExt);
    }

    public String extractCleanExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "bin";
        }
        String afterDot = fileName.substring(fileName.lastIndexOf(".") + 1).trim().toLowerCase();
        return afterDot.replaceAll("[^a-z0-9]", "");
    }
}
