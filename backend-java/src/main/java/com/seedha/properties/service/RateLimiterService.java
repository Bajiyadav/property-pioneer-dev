package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Fixed-window counter shared across application instances.
 *
 * Redis is the primary store because a per-process {@code ConcurrentHashMap}
 * stops being a rate limit the moment the service runs more than one task: with
 * N instances behind a load balancer the effective limit becomes N times what
 * was configured, and it resets on every deploy. {@code INCR} is atomic, so
 * concurrent requests on different instances share one counter.
 *
 * When Redis is absent or unreachable the in-memory counter takes over. That is
 * a degraded mode, not an equivalent one — it is announced in the logs, and
 * {@link #isDistributed()} reports which mode is live so a health endpoint can
 * surface it honestly.
 */
@Service
public class RateLimiterService {

    private static final Logger log = LoggerFactory.getLogger(RateLimiterService.class);

    private final StringRedisTemplate redisTemplate;
    private final Map<String, LocalCounter> localCounters = new ConcurrentHashMap<>();
    private volatile boolean redisHealthy;

    public RateLimiterService(@Autowired(required = false) StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.redisHealthy = redisTemplate != null;
        if (redisTemplate == null) {
            log.warn("No Redis connection configured — rate limiting is per-instance only "
                    + "and will not hold across horizontally scaled tasks.");
        }
    }

    /** True when counters are shared across instances. */
    public boolean isDistributed() {
        return redisTemplate != null && redisHealthy;
    }

    public record Decision(boolean allowed, long count, long limit, long retryAfterSeconds) {}

    /**
     * Counts one request against {@code key} and reports whether it is within
     * {@code limit} for the current window.
     */
    public Decision consume(String key, long limit, Duration window) {
        long windowSeconds = Math.max(1, window.getSeconds());
        long bucket = System.currentTimeMillis() / (windowSeconds * 1000L);
        String bucketKey = "rl:" + key + ":" + bucket;

        Long count = incrementDistributed(bucketKey, windowSeconds);
        if (count == null) {
            count = incrementLocal(bucketKey, windowSeconds);
        }

        long retryAfter = windowSeconds - (System.currentTimeMillis() / 1000L) % windowSeconds;
        return new Decision(count <= limit, count, limit, Math.max(1, retryAfter));
    }

    /** Returns null when the distributed store could not be used for this call. */
    private Long incrementDistributed(String bucketKey, long windowSeconds) {
        if (redisTemplate == null) return null;
        try {
            Long count = redisTemplate.opsForValue().increment(bucketKey);
            if (count != null && count == 1L) {
                // Only the request that created the bucket sets its lifetime, so a
                // busy key is not repeatedly pushed forward and never expires.
                redisTemplate.expire(bucketKey, Duration.ofSeconds(windowSeconds + 1));
            }
            if (!redisHealthy) {
                log.info("Redis reachable again — rate limiting is distributed once more");
                redisHealthy = true;
            }
            return count;
        } catch (RuntimeException ex) {
            if (redisHealthy) {
                log.warn("Redis unavailable for rate limiting, degrading to per-instance counters: {}",
                        ex.getMessage());
                redisHealthy = false;
            }
            return null;
        }
    }

    private long incrementLocal(String bucketKey, long windowSeconds) {
        long expiresAt = System.currentTimeMillis() + (windowSeconds + 1) * 1000L;
        LocalCounter counter = localCounters.compute(bucketKey, (k, existing) ->
                existing != null && existing.expiresAtMs > System.currentTimeMillis()
                        ? existing
                        : new LocalCounter(expiresAt));

        if (localCounters.size() > 20_000) {
            long now = System.currentTimeMillis();
            localCounters.entrySet().removeIf(e -> e.getValue().expiresAtMs <= now);
        }

        return counter.count.incrementAndGet();
    }

    private static final class LocalCounter {
        final AtomicInteger count = new AtomicInteger(0);
        final long expiresAtMs;

        LocalCounter(long expiresAtMs) {
            this.expiresAtMs = expiresAtMs;
        }
    }
}
