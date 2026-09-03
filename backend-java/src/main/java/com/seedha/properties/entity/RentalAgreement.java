package com.seedha.properties.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "rental_agreements")
public class RentalAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "monthly_rent", nullable = false)
    private BigDecimal monthlyRent;

    @Column(name = "security_deposit", nullable = false)
    private BigDecimal securityDeposit = new BigDecimal("50000");

    @Column(name = "lease_start_date", nullable = false)
    private LocalDate leaseStartDate = LocalDate.now();

    @Column(name = "lease_duration_months", nullable = false)
    private Integer leaseDurationMonths = 11;

    @Column(nullable = false)
    private String status = "DRAFT"; // DRAFT, OWNER_SIGNED, TENANT_SIGNED, ACTIVE, TERMINATED

    @Column(name = "agreement_pdf_url")
    private String agreementPdfUrl;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public RentalAgreement() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getPropertyId() { return propertyId; }
    public void setPropertyId(UUID propertyId) { this.propertyId = propertyId; }
    public UUID getOwnerId() { return ownerId; }
    public void setOwnerId(UUID ownerId) { this.ownerId = ownerId; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public BigDecimal getMonthlyRent() { return monthlyRent; }
    public void setMonthlyRent(BigDecimal monthlyRent) { this.monthlyRent = monthlyRent; }
    public BigDecimal getSecurityDeposit() { return securityDeposit; }
    public void setSecurityDeposit(BigDecimal securityDeposit) { this.securityDeposit = securityDeposit; }
    public LocalDate getLeaseStartDate() { return leaseStartDate; }
    public void setLeaseStartDate(LocalDate leaseStartDate) { this.leaseStartDate = leaseStartDate; }
    public Integer getLeaseDurationMonths() { return leaseDurationMonths; }
    public void setLeaseDurationMonths(Integer leaseDurationMonths) { this.leaseDurationMonths = leaseDurationMonths; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAgreementPdfUrl() { return agreementPdfUrl; }
    public void setAgreementPdfUrl(String agreementPdfUrl) { this.agreementPdfUrl = agreementPdfUrl; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
