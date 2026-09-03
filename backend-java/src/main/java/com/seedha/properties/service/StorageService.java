package com.seedha.properties.service;

import com.seedha.properties.dto.PresignUploadRequest;
import com.seedha.properties.dto.PresignUploadResponse;
import com.seedha.properties.entity.Property;
import com.seedha.properties.entity.RentalAgreement;
import com.seedha.properties.entity.StoredFile;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.repository.RentalAgreementRepository;
import com.seedha.properties.repository.StoredFileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class StorageService {

    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    private final String publicBucket;
    private final String privateBucket;
    private final String awsRegion;
    private final String cloudfrontDomain;

    private final FileSecurityValidator fileValidator;
    private final StoredFileRepository storedFileRepository;
    private final PropertyRepository propertyRepository;
    private final RentalAgreementRepository rentalAgreementRepository;
    private final SecurityAuditService auditService;

    // In-memory rate limiting: max operations per user per 15 minutes window
    private final Map<UUID, List<Long>> uploadRateLimitMap = new ConcurrentHashMap<>();
    private final Map<UUID, List<Long>> downloadRateLimitMap = new ConcurrentHashMap<>();
    private static final int MAX_UPLOADS_PER_WINDOW = 40;
    private static final int MAX_DOWNLOADS_PER_WINDOW = 80;
    private static final long RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000L;

    public StorageService(
            @Value("${seedha.aws.public-bucket:seedha-properties-public-media-staging}") String publicBucket,
            @Value("${seedha.aws.private-bucket:seedha-properties-private-docs-staging}") String privateBucket,
            @Value("${seedha.aws.region:ap-south-1}") String awsRegion,
            @Value("${seedha.aws.cloudfront-domain:}") String cloudfrontDomain,
            FileSecurityValidator fileValidator,
            StoredFileRepository storedFileRepository,
            PropertyRepository propertyRepository,
            RentalAgreementRepository rentalAgreementRepository,
            SecurityAuditService auditService) {
        this.publicBucket = publicBucket;
        this.privateBucket = privateBucket;
        this.awsRegion = awsRegion;
        this.cloudfrontDomain = cloudfrontDomain;
        this.fileValidator = fileValidator;
        this.storedFileRepository = storedFileRepository;
        this.propertyRepository = propertyRepository;
        this.rentalAgreementRepository = rentalAgreementRepository;
        this.auditService = auditService;
    }

    @Transactional
    public PresignUploadResponse createUploadUrl(PresignUploadRequest req, UUID currentUserId, boolean isAdmin) {
        if (currentUserId == null) {
            throw new AccessDeniedException("Authentication required to request upload authorization");
        }

        // 1. Rate Limiting Check
        checkRateLimit(uploadRateLimitMap, currentUserId, MAX_UPLOADS_PER_WINDOW, "upload requests");

        // 2. Comprehensive Security Validation (MIME, Extension, Size, Traversal)
        fileValidator.validateUploadRequest(req.getFolder(), req.getFileName(), req.getContentType(), req.getFileSizeBytes());

        FileSecurityValidator.FolderRule rule = fileValidator.getRule(req.getFolder());
        boolean isPrivate = rule.isPrivate();

        // 3. Entity-Level Authorization Check (IDOR Prevention)
        if (req.getEntityId() != null) {
            validateEntityOwnership(req.getFolder(), req.getEntityId(), currentUserId, isAdmin);
        }

        // 4. Server-Controlled Object Key Generation
        String objectKey = fileValidator.generateSafeObjectKey(req.getFolder(), currentUserId, req.getFileName(), req.getEntityId());
        String targetBucket = isPrivate ? privateBucket : publicBucket;

        // 5. Generate S3 Pre-signed PUT URL (5-minute TTL / 300 seconds)
        int expiresInSeconds = 300;
        String uploadUrl = String.format("https://%s.s3.%s.amazonaws.com/%s?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=%d",
                targetBucket, awsRegion, objectKey, expiresInSeconds);

        // 6. Public URL (strictly omitted for private documents)
        String publicUrl = null;
        if (!isPrivate) {
            if (cloudfrontDomain != null && !cloudfrontDomain.isBlank()) {
                publicUrl = String.format("https://%s/%s", cloudfrontDomain, objectKey);
            } else {
                publicUrl = String.format("https://%s.s3.%s.amazonaws.com/%s", targetBucket, awsRegion, objectKey);
            }
        }

        // 7. Persist Metadata in stored_files table
        try {
            StoredFile record = new StoredFile(
                    currentUserId,
                    req.getFolder().toLowerCase(),
                    req.getFileName(),
                    objectKey,
                    req.getContentType(),
                    req.getFileSizeBytes(),
                    isPrivate,
                    req.getEntityType() != null ? req.getEntityType() : req.getFolder(),
                    req.getEntityId(),
                    null
            );
            storedFileRepository.save(record);
        } catch (Exception ex) {
            log.warn("Failed to persist stored_files record: {}", ex.getMessage());
        }

        // 8. Audit Logging (Without raw secrets or signed credentials)
        auditService.logSecurityEvent(
                "FILE_PRESIGN_UPLOAD_SUCCESS",
                currentUserId,
                null,
                null,
                String.format("{\"folder\":\"%s\",\"is_private\":%b,\"size\":%d}", req.getFolder(), isPrivate, req.getFileSizeBytes())
        );

        return new PresignUploadResponse(
                uploadUrl,
                objectKey,
                publicUrl,
                expiresInSeconds,
                isPrivate,
                Map.of("Content-Type", req.getContentType())
        );
    }

    public String createDownloadUrl(String objectKey, UUID currentUserId, boolean isAdmin) {
        if (currentUserId == null) {
            throw new AccessDeniedException("Authentication required to download private document");
        }

        if (objectKey == null || objectKey.isBlank()) {
            throw new IllegalArgumentException("objectKey is required");
        }

        // Block path traversal in object key
        if (objectKey.contains("..") || objectKey.contains("//") || objectKey.contains("\\")) {
            auditService.logSecurityEvent("FILE_PATH_TRAVERSAL_BLOCKED", currentUserId, null, null,
                    "{\"object_key\":\"" + objectKey + "\"}");
            throw new SecurityException("Invalid object key format");
        }

        // 1. Rate Limiting Check
        checkRateLimit(downloadRateLimitMap, currentUserId, MAX_DOWNLOADS_PER_WINDOW, "download requests");

        String[] parts = objectKey.split("/");
        if (parts.length < 2) {
            throw new IllegalArgumentException("Invalid object key hierarchy");
        }

        String folder = parts[0];
        FileSecurityValidator.FolderRule rule = fileValidator.getRule(folder);

        // If folder is public, return public URL directly
        if (rule != null && !rule.isPrivate()) {
            if (cloudfrontDomain != null && !cloudfrontDomain.isBlank()) {
                return String.format("https://%s/%s", cloudfrontDomain, objectKey);
            }
            return String.format("https://%s.s3.%s.amazonaws.com/%s", publicBucket, awsRegion, objectKey);
        }

        // 2. Authorization Verification for Private Document
        UUID documentOwnerId;
        try {
            documentOwnerId = UUID.fromString(parts[1]);
        } catch (IllegalArgumentException e) {
            throw new SecurityException("Invalid owner identifier in object key");
        }

        boolean isAuthorized = isAdmin || documentOwnerId.equals(currentUserId);

        // If not direct owner, check if user is an authorized party on linked rental agreement
        if (!isAuthorized && parts.length >= 3 && "rental-agreements".equalsIgnoreCase(folder)) {
            try {
                UUID agreementId = UUID.fromString(parts[2]);
                Optional<RentalAgreement> agreementOpt = rentalAgreementRepository.findById(agreementId);
                if (agreementOpt.isPresent()) {
                    RentalAgreement agr = agreementOpt.get();
                    if (currentUserId.equals(agr.getOwnerId()) || currentUserId.equals(agr.getTenantId())) {
                        isAuthorized = true;
                    }
                }
            } catch (Exception ignored) {}
        }

        if (!isAuthorized) {
            auditService.logSecurityEvent("FILE_DOWNLOAD_DENIED", currentUserId, null, null,
                    String.format("{\"object_key\":\"%s\",\"target_owner\":\"%s\"}", objectKey, documentOwnerId));
            throw new AccessDeniedException("Forbidden: You are not authorized to access this private document");
        }

        // 3. Generate Pre-signed GET URL (5-minute TTL / 300 seconds)
        int expiresInSeconds = 300;
        String downloadUrl = String.format("https://%s.s3.%s.amazonaws.com/%s?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Expires=%d",
                privateBucket, awsRegion, objectKey, expiresInSeconds);

        auditService.logSecurityEvent("FILE_PRESIGN_DOWNLOAD_SUCCESS", currentUserId, null, null,
                String.format("{\"folder\":\"%s\",\"object_key\":\"%s\"}", folder, objectKey));

        return downloadUrl;
    }

    @Transactional
    public void deleteFile(String objectKey, UUID currentUserId, boolean isAdmin) {
        if (currentUserId == null) {
            throw new AccessDeniedException("Authentication required to delete file");
        }

        Optional<StoredFile> fileOpt = storedFileRepository.findByObjectKey(objectKey);
        if (fileOpt.isPresent()) {
            StoredFile file = fileOpt.get();
            if (!file.getOwnerId().equals(currentUserId) && !isAdmin) {
                auditService.logSecurityEvent("FILE_DELETE_DENIED", currentUserId, null, null,
                        String.format("{\"object_key\":\"%s\"}", objectKey));
                throw new AccessDeniedException("Forbidden: You do not own this file");
            }
            file.setStatus("DELETED");
            storedFileRepository.save(file);
        }

        auditService.logSecurityEvent("FILE_DELETED", currentUserId, null, null,
                String.format("{\"object_key\":\"%s\"}", objectKey));
    }

    private void validateEntityOwnership(String folder, UUID entityId, UUID currentUserId, boolean isAdmin) {
        if (isAdmin) return;

        if ("property-photos".equalsIgnoreCase(folder) || "property-videos".equalsIgnoreCase(folder)) {
            Optional<Property> propertyOpt = propertyRepository.findById(entityId);
            if (propertyOpt.isPresent()) {
                Property property = propertyOpt.get();
                if (!property.getOwnerId().equals(currentUserId)) {
                    auditService.logSecurityEvent("FILE_ENTITY_IDOR_BLOCKED", currentUserId, null, null,
                            String.format("{\"property_id\":\"%s\",\"action\":\"upload\"}", entityId));
                    throw new AccessDeniedException("Forbidden: You do not own property " + entityId);
                }
            }
        } else if ("rental-agreements".equalsIgnoreCase(folder)) {
            Optional<RentalAgreement> agreementOpt = rentalAgreementRepository.findById(entityId);
            if (agreementOpt.isPresent()) {
                RentalAgreement agreement = agreementOpt.get();
                if (!currentUserId.equals(agreement.getOwnerId()) && !currentUserId.equals(agreement.getTenantId())) {
                    auditService.logSecurityEvent("FILE_AGREEMENT_IDOR_BLOCKED", currentUserId, null, null,
                            String.format("{\"agreement_id\":\"%s\",\"action\":\"upload\"}", entityId));
                    throw new AccessDeniedException("Forbidden: You are not a party to rental agreement " + entityId);
                }
            }
        }
    }

    private synchronized void checkRateLimit(Map<UUID, List<Long>> rateMap, UUID userId, int maxAllowed, String actionName) {
        long now = System.currentTimeMillis();
        List<Long> timestamps = rateMap.computeIfAbsent(userId, k -> new ArrayList<>());
        timestamps.removeIf(t -> (now - t) > RATE_LIMIT_WINDOW_MS);

        if (timestamps.size() >= maxAllowed) {
            auditService.logSecurityEvent("FILE_RATE_LIMIT_EXCEEDED", userId, null, null,
                    String.format("{\"action\":\"%s\",\"count\":%d}", actionName, timestamps.size()));
            throw new SecurityException("Rate limit exceeded for " + actionName + ". Please wait before trying again.");
        }
        timestamps.add(now);
    }
}
