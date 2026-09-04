package com.seedha.properties.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public class PromotionOrderResponse {

    private UUID id;
    private UUID propertyId;
    private String planId;
    private Integer amountPaise;
    private String currency;
    private String status;
    private String gateway;
    private String gatewayOrderId;
    private OffsetDateTime promotionStartsAt;
    private OffsetDateTime promotionEndsAt;
    private OffsetDateTime createdAt;

    public PromotionOrderResponse() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }

    public String getPlanId() { return planId; }
    public void setPlanId(String planId) { this.planId = planId; }

    public Integer getAmountPaise() { return amountPaise; }
    public void setAmountPaise(Integer amountPaise) { this.amountPaise = amountPaise; }

    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getGateway() { return gateway; }
    public void setGateway(String gateway) { this.gateway = gateway; }

    public String getGatewayOrderId() { return gatewayOrderId; }
    public void setGatewayOrderId(String gatewayOrderId) { this.gatewayOrderId = gatewayOrderId; }

    public OffsetDateTime getPromotionStartsAt() { return promotionStartsAt; }
    public void setPromotionStartsAt(OffsetDateTime promotionStartsAt) { this.promotionStartsAt = promotionStartsAt; }

    public OffsetDateTime getPromotionEndsAt() { return promotionEndsAt; }
    public void setPromotionEndsAt(OffsetDateTime promotionEndsAt) { this.promotionEndsAt = promotionEndsAt; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
