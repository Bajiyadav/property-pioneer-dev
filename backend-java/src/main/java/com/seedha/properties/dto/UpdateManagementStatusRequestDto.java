package com.seedha.properties.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class UpdateManagementStatusRequestDto {

    @NotBlank(message = "Status is required")
    private String status;

    private String rejectionReason;
    private UUID assignedManagerId;
    private String assignedManagerName;
    private String internalNote;

    public UpdateManagementStatusRequestDto() {}

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public UUID getAssignedManagerId() { return assignedManagerId; }
    public void setAssignedManagerId(UUID assignedManagerId) { this.assignedManagerId = assignedManagerId; }

    public String getAssignedManagerName() { return assignedManagerName; }
    public void setAssignedManagerName(String assignedManagerName) { this.assignedManagerName = assignedManagerName; }

    public String getInternalNote() { return internalNote; }
    public void setInternalNote(String internalNote) { this.internalNote = internalNote; }
}
