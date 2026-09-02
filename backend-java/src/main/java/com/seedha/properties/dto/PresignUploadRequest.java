package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

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

    public PresignUploadRequest() {}

    public String getFolder() { return folder; }
    public void setFolder(String folder) { this.folder = folder; }
    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }
    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }
    public Long getFileSizeBytes() { return fileSizeBytes; }
    public void setFileSizeBytes(Long fileSizeBytes) { this.fileSizeBytes = fileSizeBytes; }
}
