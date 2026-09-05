package com.seedha.properties.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "property_management_requests")
public class PropertyManagementRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(nullable = false)
    private String status = "SUBMITTED";

    @Column(name = "assigned_manager_id")
    private UUID assignedManagerId;

    @Column(name = "assigned_manager_name")
    private String assignedManagerName;

    @Column(name = "owner_contact_name")
    private String ownerContactName;

    @Column(name = "owner_contact_phone", nullable = false)
    private String ownerContactPhone;

    @Column(name = "owner_contact_email")
    private String ownerContactEmail;

    @Column(name = "services_requested", columnDefinition = "text[]")
    private String[] servicesRequested = new String[]{"TENANT_SCREENING", "RENT_COLLECTION", "MAINTENANCE"};

    @Column(name = "owner_notes", columnDefinition = "TEXT")
    private String ownerNotes;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }

    public PropertyManagementRequest() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }

    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public UUID getAssignedManagerId() { return assignedManagerId; }
    public void setAssignedManagerId(UUID assignedManagerId) { this.assignedManagerId = assignedManagerId; }

    public String getAssignedManagerName() { return assignedManagerName; }
    public void setAssignedManagerName(String assignedManagerName) { this.assignedManagerName = assignedManagerName; }

    public String getOwnerContactName() { return ownerContactName; }
    public void setOwnerContactName(String ownerContactName) { this.ownerContactName = ownerContactName; }

    public String getOwnerContactPhone() { return ownerContactPhone; }
    public void setOwnerContactPhone(String ownerContactPhone) { this.ownerContactPhone = ownerContactPhone; }

    public String getOwnerContactEmail() { return ownerContactEmail; }
    public void setOwnerContactEmail(String ownerContactEmail) { this.ownerContactEmail = ownerContactEmail; }

    public String[] getServicesRequested() { return servicesRequested; }
    public void setServicesRequested(String[] servicesRequested) { this.servicesRequested = servicesRequested; }

    public List<String> getServicesRequestedList() {
        return servicesRequested != null ? Arrays.asList(servicesRequested) : new ArrayList<>();
    }

    public void setServicesRequestedList(List<String> list) {
        if (list == null || list.isEmpty()) {
            this.servicesRequested = new String[]{"TENANT_SCREENING", "RENT_COLLECTION", "MAINTENANCE"};
        } else {
            this.servicesRequested = list.toArray(new String[0]);
        }
    }

    public String getOwnerNotes() { return ownerNotes; }
    public void setOwnerNotes(String ownerNotes) { this.ownerNotes = ownerNotes; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
