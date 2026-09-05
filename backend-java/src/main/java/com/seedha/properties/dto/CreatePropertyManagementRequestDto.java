package com.seedha.properties.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class CreatePropertyManagementRequestDto {

    @NotNull(message = "Property ID is required")
    private UUID propertyId;

    private String ownerContactName;

    @NotBlank(message = "Contact phone number is required")
    private String ownerContactPhone;

    private String ownerContactEmail;

    private List<String> servicesRequested;

    private String ownerNotes;

    public CreatePropertyManagementRequestDto() {}

    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }

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
}
