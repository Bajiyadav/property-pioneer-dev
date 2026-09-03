package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OtpRequestDto {

    private String contact; // email or phone

    @JsonProperty("contact_type")
    private String contactType = "EMAIL"; // EMAIL or PHONE

    private String purpose = "LOGIN"; // LOGIN, SIGNUP, PASSWORD_RESET, PHONE_VERIFY, EMAIL_VERIFY

    @JsonProperty("full_name")
    private String fullName;

    private String role; // optional for signup (defaults to SEEKER)

    public OtpRequestDto() {}

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public String getContactType() { return contactType; }
    public void setContactType(String contactType) { this.contactType = contactType; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
