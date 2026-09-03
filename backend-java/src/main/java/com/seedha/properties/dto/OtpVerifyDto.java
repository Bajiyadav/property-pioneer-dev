package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class OtpVerifyDto {

    private String contact;
    private String purpose = "LOGIN";
    private String otp;

    @JsonProperty("new_password")
    private String newPassword; // for PASSWORD_RESET

    @JsonProperty("full_name")
    private String fullName; // optional for signup

    @JsonProperty("device_info")
    private String deviceInfo;

    public OtpVerifyDto() {}

    public String getContact() { return contact; }
    public void setContact(String contact) { this.contact = contact; }
    public String getPurpose() { return purpose; }
    public void setPurpose(String purpose) { this.purpose = purpose; }
    public String getOtp() { return otp; }
    public void setOtp(String otp) { this.otp = otp; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }
}
