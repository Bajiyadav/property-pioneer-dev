package com.seedha.properties.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Correlation id per request (Task 11 — observability).
 *
 * Every request gets an id that is put on the SLF4J MDC (so it appears in every
 * structured log line for that request) and echoed back in {@code X-Correlation-ID}
 * so a client — web or Flutter — can quote it in a bug report and have it join
 * up with the server logs.
 *
 * An inbound id is honoured only if it looks like one we would have issued, so a
 * client cannot inject arbitrary text into the log stream through this header.
 * Runs before the rate-limit filter so even a rejected request is traceable.
 */
@Component
@Order(0)
public class CorrelationIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Correlation-ID";
    private static final String MDC_KEY = "correlationId";
    private static final Pattern SAFE_ID = Pattern.compile("[A-Za-z0-9-]{8,64}");

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String correlationId = (incoming != null && SAFE_ID.matcher(incoming).matches())
                ? incoming
                : UUID.randomUUID().toString();

        MDC.put(MDC_KEY, correlationId);
        response.setHeader(HEADER, correlationId);
        try {
            chain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }
}
