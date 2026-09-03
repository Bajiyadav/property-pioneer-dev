package com.seedha.properties.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.UUID;

public class UserProfileDto {

    private UUID id;
    private String email;

    @JsonProperty("full_name")
    private String fullName;

    private String phone;
    private String role;

    public UserProfileDto() {}

    public UserProfileDto(UUID id, String email, String fullName, String phone, String role) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.role = role;
    }

    public UUID getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getRole() { return role; }
}
