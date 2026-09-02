package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CacheService {

    private static final Logger log = LoggerFactory.getLogger(CacheService.class);

    private final StringRedisTemplate redisTemplate;
    private final Map<String, CacheEntry> localFallbackCache = new ConcurrentHashMap<>();

    public CacheService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void set(String key, String value, Duration ttl) {
        try {
            if (redisTemplate != null) {
                redisTemplate.opsForValue().set(key, value, ttl);
                return;
            }
        } catch (Exception ex) {
            log.warn("Redis unavailable, falling back to local memory cache: {}", ex.getMessage());
        }

        // Graceful in-memory fallback
        localFallbackCache.put(key, new CacheEntry(value, System.currentTimeMillis() + ttl.toMillis()));
    }

    public String get(String key) {
        try {
            if (redisTemplate != null) {
                String val = redisTemplate.opsForValue().get(key);
                if (val != null) return val;
            }
        } catch (Exception ex) {
            log.warn("Redis read error, reading from local fallback cache: {}", ex.getMessage());
        }

        CacheEntry entry = localFallbackCache.get(key);
        if (entry != null) {
            if (System.currentTimeMillis() < entry.expiresAtMs) {
                return entry.value;
            }
            localFallbackCache.remove(key);
        }

        return null;
    }

    public void evict(String key) {
        try {
            if (redisTemplate != null) {
                redisTemplate.delete(key);
            }
        } catch (Exception ignored) {}
        localFallbackCache.remove(key);
    }

    private static class CacheEntry {
        final String value;
        final long expiresAtMs;
        CacheEntry(String value, long expiresAtMs) {
            this.value = value;
            this.expiresAtMs = expiresAtMs;
        }
    }
}
