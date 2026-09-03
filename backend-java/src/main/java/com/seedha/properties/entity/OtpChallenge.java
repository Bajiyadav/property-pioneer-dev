package com.seedha.properties.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "otp_challenges")
public class OtpChallenge {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String contact; // normalized lowercase email or E.164 phone

    @Column(name = "contact_type", nullable = false)
    private String contactType; // EMAIL, PHONE

    @Column(nullable = false)
    private String purpose; // LOGIN, SIGNUP, PASSWORD_RESET, PHONE_VERIFY, EMAIL_VERIFY

    @Column(name = "otp_hash", nullable = false)
    private String otpHash;

    @Column(nullable = false)
    private String salt;

    @Column(nullable = false)
    private int attempts = 0;

    @Column(name = "max_attempts", nullable = false)
    private int maxAttempts = 5;

    @Column(name = "is_consumed", nullable = false)
    private boolean isConsumed = false;

    @Column(name = "consumed_at")
    private OffsetDateTime consumedAt;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "created_at", insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    public OtpChallenge() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public String getContactType() { return contactType; }
    public void setContactType(String contactType) { this.contactType = contactType; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getOtpHash() { return otpHash; }
    public void setOtpHash(String otpHash) { this.otpHash = otpHash; }
    public String getSalt() { return salt; }
    public void setSalt(String salt) { this.salt = salt; }
    public int getAttempts() { return attempts; }
    public void setAttempts(int attempts) { this.attempts = attempts; }
    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }
    public boolean isConsumed() { return isConsumed; }
    public void setConsumed(boolean consumed) { isConsumed = consumed; }
    public OffsetDateTime getConsumedAt() { return consumedAt; }
    public void setConsumedAt(OffsetDateTime consumedAt) { this.consumedAt = consumedAt; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
    public String getUserAgent() { return userAgent; }
    public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}
