package com.seedha.properties.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.service.SecurityAuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, RequestCounter> requestCounts = new ConcurrentHashMap<>();
    private final SecurityAuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int MAX_REQUESTS_PER_MINUTE = 60; // 60 requests per min for auth

    public RateLimitingFilter(SecurityAuditService auditService) {
        this.auditService = auditService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path.startsWith("/api/v2/auth") && "POST".equalsIgnoreCase(request.getMethod())) {
            String clientIp = getClientIp(request);
            long currentMinute = System.currentTimeMillis() / 60000;
            String key = clientIp + ":" + currentMinute;

            RequestCounter counter = requestCounts.computeIfAbsent(key, k -> new RequestCounter());
            if (counter.increment() > MAX_REQUESTS_PER_MINUTE) {
                auditService.logSecurityEvent("RATE_LIMIT_EXCEEDED", null, clientIp, request.getHeader("User-Agent"), "{\"path\":\"" + path + "\"}");

                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                AuthResponse errorResponse = AuthResponse.error("Rate limit exceeded. Please try again later.");
                response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
                return;
            }

            // Cleanup old minutes
            if (requestCounts.size() > 5000) {
                long cutoff = currentMinute - 2;
                requestCounts.keySet().removeIf(k -> {
                    String[] parts = k.split(":");
                    return parts.length == 2 && Long.parseLong(parts[1]) < cutoff;
                });
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isBlank()) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private static class RequestCounter {
        private final AtomicInteger count = new AtomicInteger(0);
        public int increment() { return count.incrementAndGet(); }
        public int get() { return count.get(); }
    }
}
