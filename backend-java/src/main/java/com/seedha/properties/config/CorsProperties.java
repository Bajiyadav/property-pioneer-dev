package com.seedha.properties.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/**
 * Binds {@code seedha.cors.allowed-origins}.
 *
 * A YAML sequence cannot be read through {@code @Value}, which is why the list
 * had quietly resolved to nothing before. Binding it as configuration
 * properties makes the origins in application.yml the ones actually enforced.
 */
@ConfigurationProperties(prefix = "seedha.cors")
public class CorsProperties {

    /** Exact origins allowed to call the API with credentials. No wildcards. */
    private List<String> allowedOrigins = List.of();

    public List<String> getAllowedOrigins() {
        return allowedOrigins;
    }

    public void setAllowedOrigins(List<String> allowedOrigins) {
        this.allowedOrigins = allowedOrigins;
    }
}
