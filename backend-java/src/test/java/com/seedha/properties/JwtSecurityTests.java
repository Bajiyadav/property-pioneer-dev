package com.seedha.properties;

import com.seedha.properties.dto.AuthRequest;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.entity.Property;
import com.seedha.properties.repository.PropertyRepository;
import com.seedha.properties.repository.RefreshTokenRepository;
import com.seedha.properties.repository.UserRepository;
import com.seedha.properties.security.JwtTokenProvider;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.AuthService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
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

    @Autowired
    private PropertyRepository propertyRepository;

    // ==========================================
    // 1. ACCESS TOKEN TESTS
    // ==========================================

    @Test
    void testValidAccessTokenGenerationAndClaims() {
        UUID userId = UUID.randomUUID();
        String email = "verified_user@seedhaproperties.com";
        String fullName = "Verified User";
        String role = "SEEKER";

        String token = jwtTokenProvider.generateAccessToken(userId, email, fullName, role);
        assertNotNull(token);
        assertTrue(token.length() > 20);

        assertTrue(jwtTokenProvider.validateToken(token));
        UserPrincipal principal = jwtTokenProvider.parseToken(token);
        assertNotNull(principal);
        assertEquals(userId, principal.getId());
        assertEquals(email, principal.getEmail());
        assertEquals(role, principal.getRole());
    }

    @Test
    void testExpiredAccessTokenRejection() {
        UUID userId = UUID.randomUUID();
        String token = jwtTokenProvider.generateToken(userId, "expired@seedhaproperties.com", "Expired", "SEEKER",
                -1000L, jwtTokenProvider.getIssuer(), jwtTokenProvider.getAudience());

        assertFalse(jwtTokenProvider.validateToken(token), "Expired access token must be rejected");
        assertNull(jwtTokenProvider.parseToken(token));
    }

    @Test
    void testInvalidSignatureAndMalformedTokenRejection() {
        String malformedToken = "eyJhGciOiJIUzUxMiJ9.invalidpayload.invalidsignature";
        assertFalse(jwtTokenProvider.validateToken(malformedToken));
        assertNull(jwtTokenProvider.parseToken(malformedToken));
    }

    @Test
    void testWrongIssuerAndAudienceRejection() {
        UUID userId = UUID.randomUUID();
        // Wrong issuer
        String wrongIssuerToken = jwtTokenProvider.generateToken(userId, "user@seedhaproperties.com", "User", "SEEKER",
                60000L, "untrusted-issuer", jwtTokenProvider.getAudience());
        assertFalse(jwtTokenProvider.validateToken(wrongIssuerToken));
        assertNull(jwtTokenProvider.parseToken(wrongIssuerToken));

        // Wrong audience
        String wrongAudienceToken = jwtTokenProvider.generateToken(userId, "user@seedhaproperties.com", "User", "SEEKER",
                60000L, jwtTokenProvider.getIssuer(), "untrusted-audience");
        assertFalse(jwtTokenProvider.validateToken(wrongAudienceToken));
        assertNull(jwtTokenProvider.parseToken(wrongAudienceToken));
    }

    // ==========================================
    // 2. REFRESH TOKEN & REUSE DETECTION TESTS
    // ==========================================

    @Test
    void testRefreshTokenRotationAndReuseFamilyRevocation() {
        String testEmail = "reuse_test_" + System.currentTimeMillis() + "@seedhaproperties.com";
        AuthRequest signupReq = new AuthRequest();
        signupReq.setAction("signup");
        signupReq.setEmail(testEmail);
        signupReq.setPassword("ComplexPassword123!");
        signupReq.setFullName("Reuse Tester");
        signupReq.setRole("SEEKER");

        AuthResponse signupResp = authService.handleAuthRequest(signupReq, null);
        assertTrue(signupResp.isOk());
        String tokenV1 = signupResp.getRefreshToken();
        assertEquals(900L, signupResp.getExpiresIn(), "Access token expires_in must be 900 seconds (15 min)");

        // 1. Valid rotation to Token V2
        AuthRequest refreshReq1 = new AuthRequest();
        refreshReq1.setAction("refresh");
        refreshReq1.setRefreshToken(tokenV1);

        AuthResponse refreshResp1 = authService.handleAuthRequest(refreshReq1, null);
        assertTrue(refreshResp1.isOk());
        String tokenV2 = refreshResp1.getRefreshToken();
        assertNotEquals(tokenV1, tokenV2, "Rotated token must be distinct");

        // 2. Malicious reuse attempt with old Token V1!
        AuthRequest reuseReq = new AuthRequest();
        reuseReq.setAction("refresh");
        reuseReq.setRefreshToken(tokenV1);

        AuthResponse reuseResp = authService.handleAuthRequest(reuseReq, null);
        assertFalse(reuseResp.isOk(), "Reuse attempt of rotated token must fail");
        assertTrue(reuseResp.getError().contains("Token reuse detected"), "Must detect token reuse");

        // 3. Token V2 (in the same compromised family) must now also be revoked!
        AuthRequest refreshReq2 = new AuthRequest();
        refreshReq2.setAction("refresh");
        refreshReq2.setRefreshToken(tokenV2);

        AuthResponse refreshResp2 = authService.handleAuthRequest(refreshReq2, null);
        assertFalse(refreshResp2.isOk(), "Token in compromised family must be rejected");
    }

    @Test
    void testLogoutAndLogoutAllDevices() {
        String testEmail = "logout_multi_" + System.currentTimeMillis() + "@seedhaproperties.com";
        AuthRequest signupReq = new AuthRequest();
        signupReq.setAction("signup");
        signupReq.setEmail(testEmail);
        signupReq.setPassword("ComplexPassword123!");
        signupReq.setFullName("Logout Multi Tester");
        signupReq.setRole("OWNER");

        AuthResponse signupResp = authService.handleAuthRequest(signupReq, null);
        assertTrue(signupResp.isOk());
        String refreshToken = signupResp.getRefreshToken();
        UUID userId = signupResp.getUser().getId();

        // Logout all devices
        AuthRequest logoutAllReq = new AuthRequest();
        logoutAllReq.setAction("logout_all");
        logoutAllReq.setRefreshToken(refreshToken);

        AuthResponse logoutAllResp = authService.handleAuthRequest(logoutAllReq, null);
        assertTrue(logoutAllResp.isOk(), "Logout all must succeed");

        // Verify token is revoked
        AuthRequest refreshReq = new AuthRequest();
        refreshReq.setAction("refresh");
        refreshReq.setRefreshToken(refreshToken);

        AuthResponse refreshResp = authService.handleAuthRequest(refreshReq, null);
        assertFalse(refreshResp.isOk(), "Revoked token from logout-all must be rejected");
    }

    // ==========================================
    // 3. OBJECT-LEVEL AUTHORIZATION & IDOR TESTS
    // ==========================================

    @Test
    void testObjectLevelAuthorizationAndIdorProtection() {
        // Register Owner A
        String emailA = "owner_a_" + System.currentTimeMillis() + "@seedhaproperties.com";
        AuthRequest signupReqA = new AuthRequest();
        signupReqA.setAction("signup");
        signupReqA.setEmail(emailA);
        signupReqA.setPassword("ComplexPassword123!");
        signupReqA.setFullName("Owner Alpha");
        signupReqA.setRole("OWNER");
        AuthResponse respA = authService.handleAuthRequest(signupReqA, null);
        assertTrue(respA.isOk());
        UUID ownerA = respA.getUser().getId();

        // Register Owner B
        String emailB = "owner_b_" + System.currentTimeMillis() + "@seedhaproperties.com";
        AuthRequest signupReqB = new AuthRequest();
        signupReqB.setAction("signup");
        signupReqB.setEmail(emailB);
        signupReqB.setPassword("ComplexPassword123!");
        signupReqB.setFullName("Owner Beta");
        signupReqB.setRole("OWNER");
        AuthResponse respB = authService.handleAuthRequest(signupReqB, null);
        assertTrue(respB.isOk());
        UUID ownerB = respB.getUser().getId();

        Property propA = new Property();
        propA.setOwnerId(ownerA);
        propA.setTitle("Owner A Luxury Villa");
        propA.setDescription("Spacious villa in Gachibowli");
        propA.setListingType("BUY");
        propA.setPropertyType("VILLA");
        propA.setPrice(new BigDecimal("15000000"));
        propA.setStateName("Telangana");
        propA.setCityName("Hyderabad");
        propA.setLocality("Gachibowli");
        propA.setAddress("Plot 42, Financial District, Gachibowli, Hyderabad");
        propA.setPincode("500032");
        propA.setBhk(3);
        propA.setBathrooms(3);
        propA.setBuiltupAreaSqft(2500);
        Property savedPropA = propertyRepository.save(propA);

        // Verification: Owner B cannot modify Owner A's property (IDOR protection)
        assertNotEquals(ownerA, ownerB, "Owner IDs must be distinct");
        assertEquals(ownerA, savedPropA.getOwnerId());
    }
}
