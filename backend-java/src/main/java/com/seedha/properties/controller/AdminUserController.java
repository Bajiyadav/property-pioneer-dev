package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.User;
import com.seedha.properties.repository.UserRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;

    public AdminUserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> listUsers(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: Admin access required"));
        }

        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<ApiResponse<User>> updateUserRole(
            @PathVariable UUID id,
            @RequestBody Map<String, String> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null || !"ADMIN".equalsIgnoreCase(currentUser.getRole())) {
            return ResponseEntity.status(403).body(ApiResponse.error("Forbidden: Admin access required"));
        }

        String newRole = payload.get("role");
        if (newRole == null || newRole.isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("role is required"));
        }

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(ApiResponse.error("User not found"));
        }

        user.setRole(newRole.toLowerCase());
        User updated = userRepository.save(user);
        return ResponseEntity.ok(ApiResponse.success(updated));
    }
}
