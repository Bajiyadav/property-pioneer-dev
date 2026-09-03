package com.seedha.properties.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "stored_files", schema = "public")
public class StoredFile {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "folder", nullable = false, length = 100)
    private String folder;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "object_key", nullable = false, unique = true, columnDefinition = "TEXT")
    private String objectKey;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "file_size_bytes", nullable = false)
    private Long fileSizeBytes;

    @Column(name = "is_private", nullable = false)
    private boolean isPrivate = true;

    @Column(name = "entity_type", length = 50)
    private String entityType;

    @Column(name = "entity_id")
    private UUID entityId;

    @Column(name = "checksum_sha256", length = 64)
    private String checksumSha256;

    @Column(name = "status", nullable = false, length = 50)
    private String status = "ACTIVE";

    /**
     * Malware scan state: PENDING, CLEAN, INFECTED, or NOT_SCANNED. Defaults to
     * NOT_SCANNED so a file is never assumed safe. A private file is only served
     * when this is CLEAN, or when scan enforcement is off (no scanner deployed).
     */
    @Column(name = "scan_status", nullable = false, length = 30)
    private String scanStatus = "NOT_SCANNED";

    @Column(name = "scanned_at")
    private OffsetDateTime scannedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt = OffsetDateTime.now();

    public StoredFile() {}

    public StoredFile(UUID ownerId, String folder, String fileName, String objectKey,
                      String contentType, Long fileSizeBytes, boolean isPrivate,
                      String entityType, UUID entityId, String checksumSha256) {
        this.ownerId = ownerId;
        this.folder = folder;
        this.fileName = fileName;
        this.objectKey = objectKey;
        this.contentType = contentType;
        this.fileSizeBytes = fileSizeBytes;
        this.isPrivate = isPrivate;
        this.entityType = entityType;
        this.entityId = entityId;
        this.checksumSha256 = checksumSha256;
        this.status = "ACTIVE";
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getObjectKey() { return objectKey; }
    public void setObjectKey(String objectKey) { this.objectKey = objectKey; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public boolean isPrivate() { return isPrivate; }
    public void setPrivate(boolean aPrivate) { isPrivate = aPrivate; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }

    public String getChecksumSha256() { return checksumSha256; }
    public void setChecksumSha256(String checksumSha256) { this.checksumSha256 = checksumSha256; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getScanStatus() { return scanStatus; }
    public void setScanStatus(String scanStatus) { this.scanStatus = scanStatus; }
    public OffsetDateTime getScannedAt() { return scannedAt; }
    public void setScannedAt(OffsetDateTime scannedAt) { this.scannedAt = scannedAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
