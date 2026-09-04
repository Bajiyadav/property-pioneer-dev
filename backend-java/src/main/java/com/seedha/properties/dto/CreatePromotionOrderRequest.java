package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public class CreatePromotionOrderRequest {

    @NotBlank(message = "propertyId is required")
    @JsonAlias({"property_id", "propertyId"})
    private String propertyId;

    @NotBlank(message = "planId is required")
    @JsonAlias({"plan_id", "planId"})
    private String planId;

    public CreatePromotionOrderRequest() {}

    public CreatePromotionOrderRequest(String propertyId, String planId) {
        this.propertyId = propertyId;
        this.planId = planId;
    }

    public String getPropertyId() { return propertyId; }
    public void setPropertyId(String propertyId) { this.propertyId = propertyId; }

    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }
}
