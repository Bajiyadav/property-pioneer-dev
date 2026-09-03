package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.dto.UserProfileDto;
import com.seedha.properties.entity.User;
import com.seedha.properties.repository.UserRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v2/user")
public class UserProfileController {

    private final UserRepository userRepository;

    public UserProfileController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> getProfile(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        User user = userRepository.findById(currentUser.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("User not found"));
        }

        UserProfileDto dto = new UserProfileDto(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getPhone(),
                user.getRole()
        );

        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PatchMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileDto>> updateProfile(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        User user = userRepository.findById(currentUser.getId()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("User not found"));
        }

        // Mass-Assignment Protection: Only allow non-privileged fields (fullName, phone)
        // Privileged fields (role, admin, id, email, passwordHash) are strictly ignored
        if (payload.containsKey("full_name") && payload.get("full_name") instanceof String fn) {
            user.setFullName(fn);
        } else if (payload.containsKey("fullName") && payload.get("fullName") instanceof String fn) {
            user.setFullName(fn);
        }

        if (payload.containsKey("phone") && payload.get("phone") instanceof String phone) {
            user.setPhone(phone);
        }

        User saved = userRepository.save(user);

        UserProfileDto dto = new UserProfileDto(
                saved.getId(),
                saved.getEmail(),
                saved.getFullName(),
                saved.getPhone(),
                saved.getRole()
        );

        return ResponseEntity.ok(ApiResponse.success(dto));
    }
}
