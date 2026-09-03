package com.seedha.properties;

import com.seedha.properties.security.JwtTokenProvider;
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

    @Test
    void testJwtTokenGenerationAndValidation() {
        UUID userId = UUID.randomUUID();
        String email = "test_customer@seedhaproperties.com";
        String fullName = "Test Customer";
        String role = "CUSTOMER";

        String token = jwtTokenProvider.generateToken(userId, email, fullName, role);
        assertNotNull(token, "Generated JWT token should not be null");
        assertTrue(token.length() > 20, "JWT token should have valid length");

        assertTrue(jwtTokenProvider.validateToken(token), "JWT token should validate successfully");
        com.seedha.properties.security.UserPrincipal principal = jwtTokenProvider.parseToken(token);
        assertNotNull(principal, "Parsed principal should not be null");
        assertEquals(userId, principal.getId(), "Extracted user ID should match");
        assertEquals(email, principal.getEmail(), "Extracted email should match");
        assertEquals(role, principal.getRole(), "Extracted role should match");
    }
}
