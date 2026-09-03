package com.seedha.properties;

import com.seedha.properties.dto.AuthRequest;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.entity.User;
import com.seedha.properties.repository.RefreshTokenRepository;
import com.seedha.properties.repository.UserRepository;
import com.seedha.properties.security.JwtTokenProvider;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("staging")
class JwtSecurityTests {

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    void testValidAccessTokenGenerationAndValidation() {
        UUID userId = UUID.randomUUID();
        String email = "customer@seedhaproperties.com";
        String fullName = "Test Customer";
        String role = "CUSTOMER";

        String token = jwtTokenProvider.generateAccessToken(userId, email, fullName, role);
        assertNotNull(token, "Access token must not be null");
        assertTrue(token.length() > 20, "Access token must be non-empty");

        assertTrue(jwtTokenProvider.validateToken(token), "Valid token must pass validation");
        UserPrincipal principal = jwtTokenProvider.parseToken(token);
        assertNotNull(principal, "Parsed principal must not be null");
        assertEquals(userId, principal.getId());
        assertEquals(email, principal.getEmail());
        assertEquals(role, principal.getRole());
    }

    @Test
    void testExpiredAccessTokenRejection() {
        UUID userId = UUID.randomUUID();
        String email = "expired_user@seedhaproperties.com";
        String fullName = "Expired User";
        String role = "CUSTOMER";

        // Generate token with negative duration (-1000ms) to simulate expiration
        String expiredToken = jwtTokenProvider.generateToken(userId, email, fullName, role, -1000L);

        assertFalse(jwtTokenProvider.validateToken(expiredToken), "Expired token must be rejected");
        assertNull(jwtTokenProvider.parseToken(expiredToken), "Parsing expired token must return null");
    }

    @Test
    void testRefreshTokenGenerationAndRotationFlow() {
        String testEmail = "rotation_test_" + System.currentTimeMillis() + "@seedhaproperties.com";
        AuthRequest signupReq = new AuthRequest();
        signupReq.setAction("signup");
        signupReq.setEmail(testEmail);
        signupReq.setPassword("SecurePassword123!");
        signupReq.setFullName("Rotation Tester");
        signupReq.setRole("SEEKER");

        AuthResponse signupResp = authService.handleAuthRequest(signupReq, null);
        assertTrue(signupResp.isOk(), "Signup must succeed");
        assertNotNull(signupResp.getToken(), "Access token must be present");
        assertNotNull(signupResp.getRefreshToken(), "Refresh token must be present");
        assertEquals(900L, signupResp.getExpiresIn(), "Access token lifetime must be 15 minutes (900 seconds)");

        String oldRefreshToken = signupResp.getRefreshToken();

        // 1. Refresh token rotation test
        AuthRequest refreshReq = new AuthRequest();
        refreshReq.setAction("refresh");
        refreshReq.setRefreshToken(oldRefreshToken);

        AuthResponse refreshResp = authService.handleAuthRequest(refreshReq, null);
        assertTrue(refreshResp.isOk(), "Refresh request must succeed");
        assertNotNull(refreshResp.getToken(), "New access token must be generated");
        assertNotNull(refreshResp.getRefreshToken(), "New refresh token must be generated");
        assertNotEquals(oldRefreshToken, refreshResp.getRefreshToken(), "Refresh token must be rotated to a new token");

        // 2. Old refresh token must now be revoked/rejected
        AuthRequest reuseOldReq = new AuthRequest();
        reuseOldReq.setAction("refresh");
        reuseOldReq.setRefreshToken(oldRefreshToken);

        AuthResponse reuseResp = authService.handleAuthRequest(reuseOldReq, null);
        assertFalse(reuseResp.isOk(), "Reusing previous rotated refresh token must fail");
        assertTrue(reuseResp.getError().contains("Invalid or revoked"), "Error message must indicate invalid/revoked token");
    }

    @Test
    void testLogoutRevocationFlow() {
        String testEmail = "logout_test_" + System.currentTimeMillis() + "@seedhaproperties.com";
        AuthRequest signupReq = new AuthRequest();
        signupReq.setAction("signup");
        signupReq.setEmail(testEmail);
        signupReq.setPassword("SecurePassword123!");
        signupReq.setFullName("Logout Tester");
        signupReq.setRole("SEEKER");

        AuthResponse signupResp = authService.handleAuthRequest(signupReq, null);
        assertTrue(signupResp.isOk());
        String refreshToken = signupResp.getRefreshToken();

        // Perform logout
        AuthRequest logoutReq = new AuthRequest();
        logoutReq.setAction("logout");
        logoutReq.setRefreshToken(refreshToken);

        AuthResponse logoutResp = authService.handleAuthRequest(logoutReq, null);
        assertTrue(logoutResp.isOk(), "Logout must succeed");

        // Attempt refresh with logged-out token
        AuthRequest refreshReq = new AuthRequest();
        refreshReq.setAction("refresh");
        refreshReq.setRefreshToken(refreshToken);

        AuthResponse refreshResp = authService.handleAuthRequest(refreshReq, null);
        assertFalse(refreshResp.isOk(), "Logged out refresh token must be rejected");
    }
}
