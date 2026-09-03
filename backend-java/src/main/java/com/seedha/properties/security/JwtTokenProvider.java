package com.seedha.properties.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Date;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

/**
 * HS256 token signing with operational key rotation.
 *
 * A key moves through three states, and each is nothing more than an
 * environment setting:
 *
 *   ACTIVE   {@code JWT_SECRET} + {@code JWT_KEY_ID}. Signs every new token.
 *   OVERLAP  listed in {@code JWT_PREVIOUS_KEYS} as {@code kid:secret} pairs.
 *            Verifies, never signs. This is the window in which tokens minted
 *            by the just-rotated key are still accepted.
 *   RETIRED  absent from configuration. Its {@code kid} no longer resolves, so
 *            its tokens are rejected.
 *
 * Rotation: move the current {@code kid:secret} into {@code JWT_PREVIOUS_KEYS},
 * set a fresh {@code JWT_SECRET}/{@code JWT_KEY_ID}, deploy, and once the
 * longest-lived token the old key signed has expired, delete the pair. A key is
 * never removed while a token it signed can still be valid.
 *
 * This mirrors {@code src/server/auth.ts} exactly, so a token minted by the web
 * backend and one minted here rotate through the same lifecycle and each
 * verifies the other's tokens.
 */
@Component
public class JwtTokenProvider {

    private static final Logger log = LoggerFactory.getLogger(JwtTokenProvider.class);

    /** HMAC-SHA256 keys are 256 bits; a shorter secret is brute-forceable offline. */
    private static final int MIN_SECRET_BYTES = 32;

    private final String activeKid;
    private final SecretKey activeKey;
    /** Verification-only keys still inside their overlap window, by kid. Insertion-ordered for logging. */
    private final Map<String, SecretKey> previousKeys;

    private final String issuer;
    private final String audience;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final SecureRandom secureRandom = new SecureRandom();

    public JwtTokenProvider(
            @Value("${seedha.jwt.secret}") String secret,
            @Value("${seedha.jwt.key-id:seedha-key-v1}") String keyId,
            @Value("${seedha.jwt.previous-keys:}") String previousKeys,
            @Value("${seedha.jwt.issuer:seedha-properties-auth}") String issuer,
            @Value("${seedha.jwt.audience:seedha-properties-client}") String audience,
            @Value("${seedha.jwt.access-token-expiration-minutes:15}") long accessTokenMinutes,
            @Value("${seedha.jwt.refresh-token-expiration-days:30}") long refreshTokenDays) {

        // No committed default. The previous fallback was a literal in this file,
        // so anyone who could read the source could forge a token for any user id
        // and any role against every deployment that had not set JWT_SECRET.
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                    "seedha.jwt.secret (JWT_SECRET) is not configured. Signing keys are supplied by the "
                            + "deployment environment and are never checked into the repository.");
        }
        // Poison pill against known-compromised values.
        //
        // The connected Lovable/IDE sync has repeatedly re-injected a committed
        // default signing secret into the config files after it was removed. A
        // blank-check alone cannot stop that, because the re-injected value is
        // non-blank. This refuses to boot when the resolved secret is one that
        // has ever been committed to this repository — matched by SHA-256 so no
        // compromised literal lives in this file. Rotating JWT_SECRET to a fresh
        // value (owner action) is what clears it, since a new value is not on the
        // list. A signing key that is public in git history can forge a token for
        // any user and any role, so booting with one is never acceptable.
        if (isKnownCompromisedSecret(secret)) {
            throw new IllegalStateException(
                    "seedha.jwt.secret resolves to a value that was previously committed to this "
                            + "repository and is therefore compromised. Set JWT_SECRET to a freshly "
                            + "generated secret in the deployment environment; the application will not "
                            + "start with a known-exposed signing key.");
        }
        this.activeKey = keyFrom(secret, "seedha.jwt.secret");
        this.activeKid = (keyId == null || keyId.isBlank()) ? "seedha-key-v1" : keyId.trim();
        this.previousKeys = parsePreviousKeys(previousKeys, this.activeKid);

        this.issuer = issuer;
        this.audience = audience;
        this.accessTokenExpirationMs = accessTokenMinutes * 60 * 1000L;
        this.refreshTokenExpirationMs = refreshTokenDays * 24 * 60 * 60 * 1000L;

        if (!previousKeys.isBlank()) {
            log.info("JWT key rotation active: signing key '{}', {} key(s) in overlap for verification",
                    activeKid, this.previousKeys.size());
        }
    }

    private SecretKey keyFrom(String secret, String name) {
        byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
        if (bytes.length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(name + " must be at least " + MIN_SECRET_BYTES + " bytes for HS256.");
        }
        return Keys.hmacShaKeyFor(bytes);
    }

    /**
     * Parses {@code kid:secret[,kid:secret...]}. A malformed entry is rejected
     * rather than silently skipped: a skipped overlap key would sign out every
     * user still holding a token it had signed.
     */
    private Map<String, SecretKey> parsePreviousKeys(String raw, String activeKid) {
        Map<String, SecretKey> map = new LinkedHashMap<>();
        if (raw == null || raw.isBlank()) {
            return map;
        }
        for (String entry : raw.split(",")) {
            String trimmed = entry.trim();
            if (trimmed.isEmpty()) {
                continue;
            }
            int sep = trimmed.indexOf(':');
            if (sep <= 0 || sep == trimmed.length() - 1) {
                throw new IllegalStateException(
                        "seedha.jwt.previous-keys must be comma-separated kid:secret pairs.");
            }
            String kid = trimmed.substring(0, sep).trim();
            String secret = trimmed.substring(sep + 1).trim();
            if (kid.equals(activeKid)) {
                throw new IllegalStateException(
                        "seedha.jwt.previous-keys reuses the active key id '" + activeKid
                                + "' — a rotated key needs a new kid.");
            }
            map.put(kid, keyFrom(secret, "seedha.jwt.previous-keys[" + kid + "]"));
        }
        return map;
    }

    public String generateAccessToken(UUID userId, String email, String fullName, String role) {
        return generateToken(userId, email, fullName, role, accessTokenExpirationMs, issuer, audience);
    }

    public String generateToken(UUID userId, String email, String fullName, String role) {
        return generateAccessToken(userId, email, fullName, role);
    }

    public String generateToken(UUID userId, String email, String fullName, String role,
                                long customExpirationMs, String customIssuer, String customAudience) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + customExpirationMs);
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .header().keyId(activeKid).and()
                .subject(userId.toString())
                .claim("email", email)
                .claim("full_name", fullName)
                .claim("role", role != null ? role : "SEEKER")
                .id(jti)
                .issuer(customIssuer)
                .audience().add(customAudience).and()
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(activeKey)
                .compact();
    }

    public String generateRawRefreshToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }

    public String hashRefreshToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException("Raw refresh token cannot be blank");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 algorithm not available", e);
        }
    }

    public long getRefreshTokenExpirationMs() {
        return refreshTokenExpirationMs;
    }

    public long getAccessTokenExpirationSeconds() {
        return accessTokenExpirationMs / 1000L;
    }

    public String getIssuer() {
        return issuer;
    }

    public String getAudience() {
        return audience;
    }

    /** The active signing key id, for callers that need to record which key signed. */
    public String getActiveKeyId() {
        return activeKid;
    }

    public UserPrincipal parseToken(String token) {
        Claims claims = parseClaims(token);
        if (claims == null) {
            return null;
        }
        try {
            return new UserPrincipal(
                    UUID.fromString(claims.getSubject()),
                    claims.get("email", String.class),
                    claims.get("full_name", String.class),
                    claims.get("role", String.class));
        } catch (RuntimeException ex) {
            return null;
        }
    }

    public boolean validateToken(String token) {
        return parseClaims(token) != null;
    }

    /**
     * Verifies against the key named by the token's {@code kid}, falling back to
     * trying every key for legacy tokens that predate the header. The signature
     * check is always what decides — the kid only chooses which key to try, so a
     * forged kid cannot make an unsigned token validate.
     */
    private Claims parseClaims(String token) {
        String kid = readKid(token);

        if (kid != null) {
            if (kid.equals(activeKid)) {
                return verifyWith(token, activeKey);
            }
            SecretKey overlap = previousKeys.get(kid);
            // Unknown kid: a retired (or never-issued) key. Rejected outright.
            return overlap != null ? verifyWith(token, overlap) : null;
        }

        // Legacy token without a kid header: try every key in the ring.
        Claims viaActive = verifyWith(token, activeKey);
        if (viaActive != null) {
            return viaActive;
        }
        for (SecretKey key : previousKeys.values()) {
            Claims claims = verifyWith(token, key);
            if (claims != null) {
                return claims;
            }
        }
        return null;
    }

    private Claims verifyWith(String token, SecretKey key) {
        try {
            return Jwts.parser()
                    .verifyWith(key)
                    .requireIssuer(issuer)
                    .requireAudience(audience)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception ex) {
            return null;
        }
    }

    /** Reads the unverified {@code kid} header. Null when absent or unparseable. */
    private String readKid(String token) {
        try {
            int dot = token.indexOf('.');
            if (dot <= 0) {
                return null;
            }
            String headerJson = new String(
                    Base64.getUrlDecoder().decode(token.substring(0, dot)), StandardCharsets.UTF_8);
            int kidIdx = headerJson.indexOf("\"kid\"");
            if (kidIdx < 0) {
                return null;
            }
            int colon = headerJson.indexOf(':', kidIdx);
            int firstQuote = headerJson.indexOf('"', colon + 1);
            int secondQuote = headerJson.indexOf('"', firstQuote + 1);
            if (firstQuote < 0 || secondQuote < 0) {
                return null;
            }
            return headerJson.substring(firstQuote + 1, secondQuote);
        } catch (RuntimeException ex) {
            return null;
        }
    }

    /**
     * SHA-256 hex digests of signing secrets that have appeared in this repo's
     * config or history. Compared as digests so the compromised literals are not
     * re-introduced here. Add a digest whenever a secret is found to have been
     * committed; a rotated (never-committed) secret will not match.
     */
    private static final java.util.Set<String> COMPROMISED_SECRET_SHA256 = java.util.Set.of(
            // seedha.jwt.secret staging default that was committed to application*.yml
            "169581efeed15ce0282ca914458ddeac9d450ada1e3d800f028e8b43e430babe",
            // original committed application.yml default
            "3eda77d828ddb3f26de068160d0377eba5a2992fa44aa7852400dc1b0ddb7615"
    );

    private static boolean isKnownCompromisedSecret(String secret) {
        try {
            byte[] digest = java.security.MessageDigest.getInstance("SHA-256")
                    .digest(secret.getBytes(StandardCharsets.UTF_8));
            return COMPROMISED_SECRET_SHA256.contains(HexFormat.of().formatHex(digest));
        } catch (java.security.NoSuchAlgorithmException e) {
            // SHA-256 is always available on a supported JVM; fail closed if not.
            throw new IllegalStateException("SHA-256 unavailable for secret validation", e);
        }
    }

}
