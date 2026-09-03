package com.seedha.properties.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.service.RateLimiterService;
import com.seedha.properties.service.SecurityAuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.Locale;

/**
 * API-wide rate limiting.
 *
 * Two things changed from the previous version, both of which decided whether
 * the limit meant anything:
 *
 * 1. Coverage. Only {@code POST /api/v2/auth} was counted, so OTP, search,
 *    uploads, private downloads, enquiries, visits and listing creation were
 *    unlimited.
 * 2. Identity. The client IP was read from the first entry of X-Forwarded-For,
 *    a header the client writes. Sending {@code X-Forwarded-For: <random>} gave
 *    every request a fresh bucket and removed the limit entirely. The address is
 *    now taken from a fixed number of hops back from the end of the chain — the
 *    entries our own proxies appended — with the socket address as the fallback.
 */
@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {

    /**
     * How many proxies of ours sit in front of the app (ALB = 1, CloudFront+ALB = 2).
     * The address `hops` from the right of X-Forwarded-For is the last one a
     * client could not have forged. 0 disables the header entirely.
     */
    private final int trustedProxyHops;

    private final RateLimiterService rateLimiter;
    private final SecurityAuditService auditService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private record Policy(String method, String pathPrefix, int perIpPerMinute, int perUserPerMinute) {}

    /**
     * Per-endpoint budgets, first match wins. Values are per minute; the tighter
     * of the IP and user budgets applies. A user budget of 0 means the endpoint is
     * limited by IP only (it is reachable unauthenticated).
     */
    private static final List<Policy> POLICIES = List.of(
            new Policy("POST", "/api/v2/auth", 20, 0),
            new Policy("POST", "/api/v2/otp", 10, 0),
            new Policy("POST", "/api/v2/media/presign-upload", 60, 30),
            new Policy("POST", "/api/v2/media/presign-download", 60, 30),
            new Policy("POST", "/api/v2/properties", 60, 20),
            new Policy("POST", "/api/v2/enquiries", 10, 20),
            new Policy("POST", "/api/v2/visits", 10, 20),
            new Policy("POST", "/api/v2/home-loans", 10, 20),
            new Policy("POST", "/api/v2/rental-agreements", 30, 30),
            new Policy("GET", "/api/v2/properties", 120, 0),
            new Policy("GET", "/api/v2/stats", 120, 0));

    /** Backstop for any authenticated endpoint without its own policy. */
    private static final int DEFAULT_PER_USER_PER_MINUTE = 300;
    private static final int DEFAULT_PER_IP_PER_MINUTE = 600;

    private static final Duration WINDOW = Duration.ofMinutes(1);

    public RateLimitingFilter(RateLimiterService rateLimiter,
                              SecurityAuditService auditService,
                              @Value("${seedha.security.trusted-proxy-hops:1}") int trustedProxyHops) {
        this.rateLimiter = rateLimiter;
        this.auditService = auditService;
        this.trustedProxyHops = Math.max(0, trustedProxyHops);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        if (path == null || (!path.startsWith("/api/") && !path.startsWith("/actuator/"))
                || path.startsWith("/api/health") || path.startsWith("/actuator/health")) {
            filterChain.doFilter(request, response);
            return;
        }

        String method = request.getMethod() == null ? "" : request.getMethod().toUpperCase(Locale.ROOT);
        Policy policy = policyFor(method, path);

        String clientIp = getClientIp(request);
        int ipLimit = policy != null ? policy.perIpPerMinute() : DEFAULT_PER_IP_PER_MINUTE;

        RateLimiterService.Decision ipDecision =
                rateLimiter.consume("ip:" + clientIp + ":" + bucketName(policy, method), ipLimit, WINDOW);
        if (!ipDecision.allowed()) {
            reject(request, response, clientIp, path, "ip", ipDecision);
            return;
        }

        // The authenticated subject is counted separately so one account cannot
        // spread abuse across many addresses, and a shared NAT does not punish
        // everyone behind it for one user's traffic.
        String subject = authenticatedSubject(request);
        int userLimit = policy != null && policy.perUserPerMinute() > 0
                ? policy.perUserPerMinute()
                : DEFAULT_PER_USER_PER_MINUTE;
        if (subject != null) {
            RateLimiterService.Decision userDecision =
                    rateLimiter.consume("user:" + subject + ":" + bucketName(policy, method), userLimit, WINDOW);
            if (!userDecision.allowed()) {
                reject(request, response, clientIp, path, "user", userDecision);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String bucketName(Policy policy, String method) {
        return policy != null ? policy.method() + policy.pathPrefix() : method + ":default";
    }

    private Policy policyFor(String method, String path) {
        for (Policy p : POLICIES) {
            if (p.method().equals(method) && path.startsWith(p.pathPrefix())) {
                return p;
            }
        }
        return null;
    }

    private void reject(HttpServletRequest request, HttpServletResponse response,
                        String clientIp, String path, String dimension,
                        RateLimiterService.Decision decision) throws IOException {

        auditService.logSecurityEvent("RATE_LIMIT_EXCEEDED", null, clientIp,
                request.getHeader("User-Agent"),
                "{\"path\":\"" + path.replaceAll("[^A-Za-z0-9/_-]", "")
                        + "\",\"dimension\":\"" + dimension
                        + "\",\"limit\":" + decision.limit() + "}");

        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setHeader("Retry-After", String.valueOf(decision.retryAfterSeconds()));
        AuthResponse errorResponse = AuthResponse.error("Rate limit exceeded. Please try again later.");
        response.getWriter().write(objectMapper.writeValueAsString(errorResponse));
    }

    /**
     * A stable per-credential bucket id.
     *
     * This filter runs ahead of authentication, so the token's `sub` claim is not
     * yet trustworthy. Bucketing on a claimed subject would let anyone burn
     * another account's budget by sending an unsigned token naming them. Hashing
     * the bearer token instead is forge-proof in the direction that matters: a
     * made-up token gets its own bucket and still pays the IP budget, while a
     * real session's requests all share one. The cost is that a user holding
     * several valid tokens gets one bucket per token — bounded by how many times
     * they have actually logged in.
     *
     * The digest never leaves the process and the raw token is never stored.
     */
    private String authenticatedSubject(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) return null;
        String token = header.substring(7).trim();
        if (token.isEmpty()) return null;
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest, 0, 16);
        } catch (java.security.NoSuchAlgorithmException ex) {
            return null;
        }
    }

    String getClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();
        if (trustedProxyHops == 0) {
            return remoteAddr;
        }

        String xff = request.getHeader("X-Forwarded-For");
        if (xff == null || xff.isBlank()) {
            return remoteAddr;
        }

        String[] parts = xff.split(",");
        int index = parts.length - trustedProxyHops;
        if (index < 0 || index >= parts.length) {
            // Chain shorter than expected: the header did not come through our
            // proxies as configured, so it is not trustworthy.
            return remoteAddr;
        }
        String candidate = parts[index].trim();
        return candidate.isEmpty() ? remoteAddr : candidate;
    }
}
