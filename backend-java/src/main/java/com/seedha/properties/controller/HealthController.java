package com.seedha.properties.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        return ResponseEntity.ok(Map.of(
                "ok", true,
                "service", "seedha-java-backend",
                "version", "2.0.0",
                "timestamp", System.currentTimeMillis()
        ));
    }
}
