package com.seedha.properties.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class InternalNoteResponseDto {

    private UUID id;
    private UUID managementRequestId;
    private UUID authorId;
    private String authorName;
    private String authorRole;
    private String note;
    private OffsetDateTime createdAt;

    public InternalNoteResponseDto() {}

    public InternalNoteResponseDto(UUID id, UUID managementRequestId, UUID authorId, String authorName, String authorRole, String note, OffsetDateTime createdAt) {
        this.id = id;
        this.managementRequestId = managementRequestId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorRole = authorRole;
        this.note = note;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getManagementRequestId() { return managementRequestId; }
    public void setManagementRequestId(UUID managementRequestId) { this.managementRequestId = managementRequestId; }

    public UUID getAuthorId() { return authorId; }
    public void setAuthorId(UUID authorId) { this.authorId = authorId; }

    public String getAuthorName() { return authorName; }
    public void setAuthorName(String authorName) { this.authorName = authorName; }

    public String getAuthorRole() { return authorRole; }
    public void setAuthorRole(String authorRole) { this.authorRole = authorRole; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
