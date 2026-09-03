package com.seedha.properties;

import com.seedha.properties.security.JwtTokenProvider;
import com.seedha.properties.security.UserPrincipal;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Operational JWT key rotation (Task 2), Java side.
 *
 * A plain unit test — it constructs JwtTokenProvider directly with test keys,
 * so it needs no Spring context and no database, and therefore no credentials.
 * The claim under test: ACTIVE signs, OVERLAP verifies, RETIRED rejects.
 */
class JwtKeyRotationTests {

    private static final String ISSUER = "seedha-properties-auth";
    private static final String AUDIENCE = "seedha-properties-client";
    private static final String KEY_A = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; // >= 32 bytes
    private static final String KEY_B = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    private final UUID userId = UUID.randomUUID();

    private JwtTokenProvider provider(String secret, String kid, String previousKeys) {
        return new JwtTokenProvider(secret, kid, previousKeys, ISSUER, AUDIENCE, 15, 30);
    }

    @Test
    void tokenFromPreviousKeyVerifiesDuringOverlap() {
        JwtTokenProvider oldProvider = provider(KEY_A, "kA", "");
        String token = oldProvider.generateAccessToken(userId, "u@test.local", "U", "SEEKER");

        // Rotate: B is active, A is in overlap.
        JwtTokenProvider rotated = provider(KEY_B, "kB", "kA:" + KEY_A);

        assertTrue(rotated.validateToken(token));
        UserPrincipal principal = rotated.parseToken(token);
        assertNotNull(principal);
        assertEquals(userId, principal.getId());
    }

    @Test
    void tokenFromRetiredKeyIsRejected() {
        String token = provider(KEY_A, "kA", "").generateAccessToken(userId, "u@test.local", "U", "SEEKER");

        // A is retired: not active, not in overlap.
        JwtTokenProvider afterRetire = provider(KEY_B, "kB", "");

        assertFalse(afterRetire.validateToken(token));
        assertNull(afterRetire.parseToken(token));
    }

    @Test
    void activeKeySignsAndVerifies() {
        JwtTokenProvider p = provider(KEY_A, "kA", "kB:" + KEY_B);
        String token = p.generateAccessToken(userId, "u@test.local", "U", "OWNER");
        assertTrue(p.validateToken(token));
        assertEquals("kA", p.getActiveKeyId());
    }

    @Test
    void reusingActiveKidInOverlapListIsRejectedAtConstruction() {
        assertThrows(IllegalStateException.class, () -> provider(KEY_A, "kA", "kA:" + KEY_B));
    }

    @Test
    void malformedOverlapEntryIsRejectedNotSilentlyDropped() {
        assertThrows(IllegalStateException.class, () -> provider(KEY_A, "kA", "not-a-pair"));
    }

    @Test
    void shortSecretIsRejected() {
        assertThrows(IllegalStateException.class, () -> provider("tooshort", "kA", ""));
    }

    @Test
    void missingSecretFailsClosed() {
        assertThrows(IllegalStateException.class, () -> provider("", "kA", ""));
        assertThrows(IllegalStateException.class, () -> provider(null, "kA", ""));
    }

    @Test
    void tamperedTokenIsRejectedUnderEveryKey() {
        JwtTokenProvider p = provider(KEY_A, "kA", "kB:" + KEY_B);
        String token = p.generateAccessToken(userId, "u@test.local", "U", "SEEKER");
        String forged = token.substring(0, token.lastIndexOf('.') + 1) + "x".repeat(43);
        assertFalse(p.validateToken(forged));
    }
}
