package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;

public class AuthRequest {

    private String action; // signup, login, session, refresh, logout, logout_all

    @Email
    private String email;

    private String password;

    @JsonProperty("full_name")
    private String fullName;

    private String phone;
    private String role;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("device_info")
    private String deviceInfo;

    @JsonProperty("logout_all")
    private boolean logoutAll = false;

    public AuthRequest() {}

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public String getDeviceInfo() { return deviceInfo; }
    public void setDeviceInfo(String deviceInfo) { this.deviceInfo = deviceInfo; }
    public boolean isLogoutAll() { return logoutAll; }
    public void setLogoutAll(boolean logoutAll) { this.logoutAll = logoutAll; }
}
