package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public class AuthResponse {

    private boolean ok;
    private String token;

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("expires_in")
    private Long expiresIn;

    private UserDto user;
    private String error;

    public AuthResponse() {}

    public static AuthResponse success(String token, String refreshToken, Long expiresIn, UUID id, String email, String fullName, String role) {
        AuthResponse resp = new AuthResponse();
        resp.setOk(true);
        resp.setToken(token);
        resp.setRefreshToken(refreshToken);
        resp.setExpiresIn(expiresIn);
        if (id != null) {
            resp.setUser(new UserDto(id, email, fullName, role));
        }
        return resp;
    }

    public static AuthResponse error(String error) {
        AuthResponse resp = new AuthResponse();
        resp.setOk(false);
        resp.setError(error);
        return resp;
    }

    public boolean isOk() { return ok; }
    public void setOk(boolean ok) { this.ok = ok; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
    public Long getExpiresIn() { return expiresIn; }
    public void setExpiresIn(Long expiresIn) { this.expiresIn = expiresIn; }
    public UserDto getUser() { return user; }
    public void setUser(UserDto user) { this.user = user; }
    public String getError() { return error; }
    public void setError(String error) { this.error = error; }

    public static class UserDto {
        private UUID id;
        private String email;
        @JsonProperty("full_name")
        private String fullName;
        private String role;

        public UserDto(UUID id, String email, String fullName, String role) {
            this.id = id;
            this.email = email;
            this.fullName = fullName;
            this.role = role;
        }

        public UUID getId() { return id; }
        public String getEmail() { return email; }
        public String getFullName() { return fullName; }
        public String getRole() { return role; }
    }
}
