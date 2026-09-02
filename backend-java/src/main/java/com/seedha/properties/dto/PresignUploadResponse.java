package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.Map;

public class PresignUploadResponse {

    @JsonProperty("upload_url")
    private String uploadUrl;

    @JsonProperty("object_key")
    private String objectKey;

    @JsonProperty("expires_in_seconds")
    private int expiresInSeconds;

    @JsonProperty("is_private")
    private boolean isPrivate;

    private Map<String, String> headers;

    public PresignUploadResponse(String uploadUrl, String objectKey, int expiresInSeconds, boolean isPrivate, Map<String, String> headers) {
        this.uploadUrl = uploadUrl;
        this.objectKey = objectKey;
        this.expiresInSeconds = expiresInSeconds;
        this.isPrivate = isPrivate;
        this.headers = headers;
    }

    public String getUploadUrl() { return uploadUrl; }
    public String getObjectKey() { return objectKey; }
    public int getExpiresInSeconds() { return expiresInSeconds; }
    public boolean isPrivate() { return isPrivate; }
    public Map<String, String> getHeaders() { return headers; }
}
