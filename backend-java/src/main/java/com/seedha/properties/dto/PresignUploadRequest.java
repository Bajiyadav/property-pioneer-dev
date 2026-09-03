package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class PresignUploadRequest {

    @NotBlank
    private String folder;

    @NotBlank
    @JsonProperty("file_name")
    private String fileName;

    @NotBlank
    @JsonProperty("content_type")
    private String contentType;

    @NotNull
    @JsonProperty("file_size_bytes")
    private Long fileSizeBytes;

    @JsonProperty("entity_id")
    private UUID entityId;

    @JsonProperty("entity_type")
    private String entityType;

    public PresignUploadRequest() {}

    public PresignUploadRequest(String folder, String fileName, String contentType, Long fileSizeBytes) {
        this.folder = folder;
        this.fileName = fileName;
        this.contentType = contentType;
        this.fileSizeBytes = fileSizeBytes;
    }

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }

    public UUID getEntityId() { return entityId; }
    public void setEntityId(UUID entityId) { this.entityId = entityId; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
}
