package com.seedha.properties.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class PropertyManagementResponseDto {

    private UUID id;
    private UUID propertyId;
    private UUID ownerId;
    private String status;
    private String assignedManagerName;
    private String ownerContactName;
    private String ownerContactPhone;
    private String ownerContactEmail;
    private List<String> servicesRequested;
    private String ownerNotes;
    private String rejectionReason;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    // Optional property title and city for owner convenience
    private String propertyTitle;
    private String propertyCity;

    public PropertyManagementResponseDto() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getAssignedManagerName() { return assignedManagerName; }
    public void setAssignedManagerName(String assignedManagerName) { this.assignedManagerName = assignedManagerName; }

    public String getOwnerContactName() { return ownerContactName; }
    public void setOwnerContactName(String ownerContactName) { this.ownerContactName = ownerContactName; }

    public String getOwnerContactPhone() { return ownerContactPhone; }
    public void setOwnerContactPhone(String ownerContactPhone) { this.ownerContactPhone = ownerContactPhone; }

    public String getOwnerContactEmail() { return ownerContactEmail; }
    public void setOwnerContactEmail(String ownerContactEmail) { this.ownerContactEmail = ownerContactEmail; }

    public List<String> getServicesRequested() { return servicesRequested; }
    public void setServicesRequested(List<String> servicesRequested) { this.servicesRequested = servicesRequested; }

    public String getOwnerNotes() { return ownerNotes; }
    public void setOwnerNotes(String ownerNotes) { this.ownerNotes = ownerNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public String getPropertyTitle() { return propertyTitle; }
    public void setPropertyTitle(String propertyTitle) { this.propertyTitle = propertyTitle; }

    public String getPropertyCity() { return propertyCity; }
    public void setPropertyCity(String propertyCity) { this.propertyCity = propertyCity; }
}
