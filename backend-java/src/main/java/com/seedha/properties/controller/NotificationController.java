package com.seedha.properties.controller;

import com.seedha.properties.dto.ApiResponse;
import com.seedha.properties.entity.Notification;
import com.seedha.properties.repository.NotificationRepository;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v2/notifications")
public class NotificationController {

    private final NotificationRepository notificationRepository;

    public NotificationController(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Notification>>> getNotifications(
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        List<Notification> list = notificationRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PatchMapping
    public ResponseEntity<ApiResponse<Map<String, Object>>> markAsRead(
            @RequestBody Map<String, Object> payload,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        if (currentUser == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Unauthorized"));
        }

        String notifIdStr = (String) payload.get("id");
        if (notifIdStr != null) {
            UUID notifId = UUID.fromString(notifIdStr);
            notificationRepository.findById(notifId).ifPresent(n -> {
                if (n.getUserId().equals(currentUser.getId())) {
                    n.setIsRead(true);
                    notificationRepository.save(n);
                }
            });
        }

        return ResponseEntity.ok(ApiResponse.success(Map.of("marked_read", true)));
    }
}
