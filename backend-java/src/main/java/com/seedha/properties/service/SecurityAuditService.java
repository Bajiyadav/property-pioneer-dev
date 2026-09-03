package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class SecurityAuditService {

    private static final Logger log = LoggerFactory.getLogger(SecurityAuditService.class);
    private final JdbcTemplate jdbcTemplate;

    public SecurityAuditService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void logSecurityEvent(String eventType, UUID userId, String ipAddress, String userAgent, String detailsJson) {
        // Structured log output (Strictly omitting passwords, JWT tokens, or raw secrets)
        log.info("SECURITY_AUDIT: event_type=\"{}\" user_id=\"{}\" ip=\"{}\" details=\"{}\"",
                eventType, userId != null ? userId.toString() : "ANONYMOUS",
                ipAddress != null ? ipAddress : "UNKNOWN",
                detailsJson != null ? detailsJson : "{}");

        try {
            jdbcTemplate.update(
                    "INSERT INTO public.security_audit_logs (event_type, user_id, ip_address, user_agent, details) VALUES (?, ?, ?, ?, ?::jsonb)",
                    eventType, userId, ipAddress, userAgent, detailsJson != null ? detailsJson : "{}"
            );
        } catch (Exception ex) {
            log.warn("Failed to persist security audit record: {}", ex.getMessage());
        }
    }
}
