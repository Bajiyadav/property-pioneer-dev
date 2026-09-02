package com.seedha.properties.controller;

import com.seedha.properties.security.UserPrincipal;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/v2/realtime")
public class RealtimeNotificationController {

    // Thread-safe map of active client SSE emitters keyed by user ID
    private final Map<UUID, SseEmitter> emitters = new ConcurrentHashMap<>();

    @GetMapping(path = "/events", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            SseEmitter emitter = new SseEmitter(0L);
            emitter.completeWithError(new IllegalAccessException("Unauthorized"));
            return emitter;
        }

        // 30-minute timeout for SSE stream
        SseEmitter emitter = new SseEmitter(1800000L);
        UUID userId = currentUser.getId();
        emitters.put(userId, emitter);

        emitter.onCompletion(() -> emitters.remove(userId));
        emitter.onTimeout(() -> emitters.remove(userId));
        emitter.onError(e -> emitters.remove(userId));

        try {
            emitter.send(SseEmitter.event()
                    .name("CONNECTED")
                    .data(Map.of("status", "connected", "userId", userId.toString())));
        } catch (IOException e) {
            emitters.remove(userId);
        }

        return emitter;
    }

    public void sendToUser(UUID userId, String eventName, Object data) {
        SseEmitter emitter = emitters.get(userId);
        if (emitter != null) {
            try {
                emitter.send(SseEmitter.event().name(eventName).data(data));
            } catch (IOException e) {
                emitters.remove(userId);
            }
        }
    }
}
