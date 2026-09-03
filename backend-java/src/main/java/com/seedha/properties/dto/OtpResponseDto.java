package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class OtpResponseDto {

    private boolean ok;
    private String message;

    @JsonProperty("cooldown_seconds")
    private Integer cooldownSeconds;

    @JsonProperty("expires_in_seconds")
    private Integer expiresInSeconds;

    @JsonProperty("auth")
    private AuthResponse auth;

    public OtpResponseDto() {}

    public OtpResponseDto(boolean ok, String message) {
        this.ok = ok;
        this.message = message;
    }

    public static OtpResponseDto success(String message, Integer cooldownSeconds, Integer expiresInSeconds) {
        OtpResponseDto resp = new OtpResponseDto(true, message);
        resp.setCooldownSeconds(cooldownSeconds);
        resp.setExpiresInSeconds(expiresInSeconds);
        return resp;
    }

    public static OtpResponseDto successWithAuth(String message, AuthResponse auth) {
        OtpResponseDto resp = new OtpResponseDto(true, message);
        resp.setAuth(auth);
        return resp;
    }

    public static OtpResponseDto error(String message) {
        return new OtpResponseDto(false, message);
    }

    public boolean isOk() { return ok; }
    public void setOk(boolean ok) { this.ok = ok; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Integer getCooldownSeconds() { return cooldownSeconds; }
    public void setCooldownSeconds(Integer cooldownSeconds) { this.cooldownSeconds = cooldownSeconds; }
    public Integer getExpiresInSeconds() { return expiresInSeconds; }
    public void setExpiresInSeconds(Integer expiresInSeconds) { this.expiresInSeconds = expiresInSeconds; }
    public AuthResponse getAuth() { return auth; }
    public void setAuth(AuthResponse auth) { this.auth = auth; }
}
