package com.seedha.properties.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @Autowired(required = false)
    private DataSource dataSource;

    @GetMapping("/api/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        boolean dbHealthy = checkDatabase();
        Map<String, Object> response = new HashMap<>();
        response.put("ok", dbHealthy);
        response.put("status", dbHealthy ? "UP" : "DEGRADED");
        response.put("service", "seedha-java-backend");
        response.put("version", "2.0.0");
        response.put("database", dbHealthy ? "CONNECTED" : "UNAVAILABLE");
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.status(dbHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    @GetMapping("/api/health/liveness")
    public ResponseEntity<Map<String, Object>> liveness() {
        return ResponseEntity.ok(Map.of(
                "status", "UP",
                "check", "liveness",
                "timestamp", System.currentTimeMillis()
        ));
    }

    @GetMapping("/api/health/readiness")
    public ResponseEntity<Map<String, Object>> readiness() {
        boolean dbHealthy = checkDatabase();
        Map<String, Object> response = new HashMap<>();
        response.put("status", dbHealthy ? "READY" : "NOT_READY");
        response.put("database", dbHealthy ? "CONNECTED" : "DISCONNECTED");
        response.put("timestamp", System.currentTimeMillis());

        return ResponseEntity.status(dbHealthy ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE).body(response);
    }

    private boolean checkDatabase() {
        if (dataSource == null) {
            return false;
        }
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {
            return stmt.execute("SELECT 1");
        } catch (Exception e) {
            return false;
        }
    }
}
