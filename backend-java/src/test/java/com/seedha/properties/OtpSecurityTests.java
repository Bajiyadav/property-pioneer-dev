package com.seedha.properties;

import com.seedha.properties.dto.OtpRequestDto;
import com.seedha.properties.dto.OtpResponseDto;
import com.seedha.properties.dto.OtpVerifyDto;
import com.seedha.properties.entity.OtpChallenge;
import com.seedha.properties.entity.User;
import com.seedha.properties.repository.OtpChallengeRepository;
import com.seedha.properties.repository.UserRepository;
import com.seedha.properties.service.OtpDeliveryService;
import com.seedha.properties.service.OtpService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@SpringBootTest
@ActiveProfiles("staging")
public class OtpSecurityTests {

    @Autowired
    private OtpService otpService;

    @Autowired
    private OtpChallengeRepository otpChallengeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private OtpDeliveryService mockDeliveryService;

    private String capturedOtp;

    @BeforeEach
    void setUp() {
        capturedOtp = null;
        doAnswer(invocation -> {
            capturedOtp = invocation.getArgument(3);
            return null;
        }).when(mockDeliveryService).deliverOtp(anyString(), anyString(), anyString(), anyString());
    }

    // 1. Valid OTP Verification Success
    @Test
    @DisplayName("1. Valid OTP -> Success with short-lived access and refresh tokens")
    void testValidOtpVerificationSuccess() {
        String email = "otp_valid_" + UUID.randomUUID() + "@seedhaproperties.com";
        User user = new User(email, passwordEncoder.encode("SecretPass123!"), "OTP User", null, "SEEKER");
        userRepository.save(user);

        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("LOGIN");

        OtpResponseDto reqResp = otpService.requestOtp(req, "192.168.1.10", "JUnit-Test");
        assertTrue(reqResp.isOk());
        assertNotNull(capturedOtp);
        assertEquals(6, capturedOtp.length());

        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(email);
        verifyReq.setPurpose("LOGIN");
        verifyReq.setOtp(capturedOtp);

        OtpResponseDto verifyResp = otpService.verifyOtp(verifyReq, "192.168.1.10", "JUnit-Test");
        assertTrue(verifyResp.isOk());
        assertNotNull(verifyResp.getAuth());
        assertNotNull(verifyResp.getAuth().getAccessToken());
        assertNotNull(verifyResp.getAuth().getRefreshToken());
        assertEquals("SEEKER", verifyResp.getAuth().getUser().getRole());
    }

    // 2. Invalid OTP Rejection
    @Test
    @DisplayName("2. Invalid OTP -> Rejected")
    void testInvalidOtpRejection() {
        String email = "otp_invalid_" + UUID.randomUUID() + "@seedhaproperties.com";
        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("LOGIN");
        otpService.requestOtp(req, "192.168.1.11", "JUnit-Test");

        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(email);
        verifyReq.setPurpose("LOGIN");
        verifyReq.setOtp("000000"); // Wrong OTP

        OtpResponseDto verifyResp = otpService.verifyOtp(verifyReq, "192.168.1.11", "JUnit-Test");
        assertFalse(verifyResp.isOk());
        assertEquals("Invalid verification code.", verifyResp.getMessage());
    }

    // 3. Expired OTP Rejection
    @Test
    @DisplayName("3. Expired OTP -> Rejected")
    void testExpiredOtpRejection() {
        String email = "otp_expired_" + UUID.randomUUID() + "@seedhaproperties.com";
        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("LOGIN");
        otpService.requestOtp(req, "192.168.1.12", "JUnit-Test");

        // Artificially expire the challenge in DB
        OtpChallenge challenge = otpChallengeRepository
                .findTopByContactAndPurposeAndIsConsumedFalseOrderByCreatedAtDesc(email, "LOGIN")
                .orElseThrow();
        challenge.setExpiresAt(OffsetDateTime.now().minusSeconds(10));
        otpChallengeRepository.save(challenge);

        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(email);
        verifyReq.setPurpose("LOGIN");
        verifyReq.setOtp(capturedOtp);

        OtpResponseDto verifyResp = otpService.verifyOtp(verifyReq, "192.168.1.12", "JUnit-Test");
        assertFalse(verifyResp.isOk());
        assertTrue(verifyResp.getMessage().toLowerCase().contains("expired"));
    }

    // 4. Single-Use Protection (Reused OTP Rejection)
    @Test
    @DisplayName("4. Single-Use Protection -> Reused OTP rejected immediately")
    void testReusedOtpRejectionSingleUse() {
        String email = "otp_singleuse_" + UUID.randomUUID() + "@seedhaproperties.com";
        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("LOGIN");
        otpService.requestOtp(req, "192.168.1.13", "JUnit-Test");

        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(email);
        verifyReq.setPurpose("LOGIN");
        verifyReq.setOtp(capturedOtp);

        // 1st Verification: Success
        OtpResponseDto firstResp = otpService.verifyOtp(verifyReq, "192.168.1.13", "JUnit-Test");
        assertTrue(firstResp.isOk());

        // 2nd Verification with same code: Rejected
        OtpResponseDto secondResp = otpService.verifyOtp(verifyReq, "192.168.1.13", "JUnit-Test");
        assertFalse(secondResp.isOk());
    }

    // 5. Maximum Attempts Exceeded Locks Challenge
    @Test
    @DisplayName("5. Maximum Attempts Exceeded -> Challenge locked & invalidated")
    void testMaximumAttemptsExceededLocksChallenge() {
        String email = "otp_maxattempts_" + UUID.randomUUID() + "@seedhaproperties.com";
        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("LOGIN");
        otpService.requestOtp(req, "192.168.1.14", "JUnit-Test");

        String validCode = capturedOtp;

        OtpVerifyDto wrongReq = new OtpVerifyDto();
        wrongReq.setContact(email);
        wrongReq.setPurpose("LOGIN");
        wrongReq.setOtp("111111");

        // Exhaust 5 failed attempts
        for (int i = 0; i < 5; i++) {
            OtpResponseDto resp = otpService.verifyOtp(wrongReq, "192.168.1.14", "JUnit-Test");
            assertFalse(resp.isOk());
        }

        // Even with the correct code, the challenge is now locked/consumed
        OtpVerifyDto validReq = new OtpVerifyDto();
        validReq.setContact(email);
        validReq.setPurpose("LOGIN");
        validReq.setOtp(validCode);

        OtpResponseDto finalResp = otpService.verifyOtp(validReq, "192.168.1.14", "JUnit-Test");
        assertFalse(finalResp.isOk());
    }

    // 6. Resend Cooldown Enforcement
    @Test
    @DisplayName("6. Resend Cooldown -> Requesting within 60s is rejected")
    void testOtpResendCooldown() {
        String email = "otp_cooldown_" + UUID.randomUUID() + "@seedhaproperties.com";
        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("LOGIN");

        OtpResponseDto first = otpService.requestOtp(req, "192.168.1.15", "JUnit-Test");
        assertTrue(first.isOk());

        // Second request immediately -> rejected by cooldown
        OtpResponseDto second = otpService.requestOtp(req, "192.168.1.15", "JUnit-Test");
        assertFalse(second.isOk());
        assertTrue(second.getMessage().toLowerCase().contains("wait"));
    }

    // 7. Purpose Binding: LOGIN vs SIGNUP vs PASSWORD_RESET
    @Test
    @DisplayName("7. Purpose Binding -> LOGIN OTP cannot be used for SIGNUP")
    void testPurposeBindingLoginVsSignup() {
        String email = "otp_purpose_" + UUID.randomUUID() + "@seedhaproperties.com";
        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("LOGIN");
        otpService.requestOtp(req, "192.168.1.16", "JUnit-Test");

        // Attempt to verify with SIGNUP purpose
        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(email);
        verifyReq.setPurpose("SIGNUP");
        verifyReq.setOtp(capturedOtp);

        OtpResponseDto verifyResp = otpService.verifyOtp(verifyReq, "192.168.1.16", "JUnit-Test");
        assertFalse(verifyResp.isOk());
    }

    // 8. Contact Binding: User A vs User B Isolation
    @Test
    @DisplayName("8. Contact Binding -> User A OTP cannot verify User B")
    void testContactBindingUserIsolation() {
        String emailA = "otp_usera_" + UUID.randomUUID() + "@seedhaproperties.com";
        String emailB = "otp_userb_" + UUID.randomUUID() + "@seedhaproperties.com";

        OtpRequestDto req = new OtpRequestDto();
        req.setContact(emailA);
        req.setPurpose("LOGIN");
        otpService.requestOtp(req, "192.168.1.17", "JUnit-Test");

        String codeA = capturedOtp;

        // Attacker B attempts to verify with code from User A
        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(emailB);
        verifyReq.setPurpose("LOGIN");
        verifyReq.setOtp(codeA);

        OtpResponseDto verifyResp = otpService.verifyOtp(verifyReq, "192.168.1.17", "JUnit-Test");
        assertFalse(verifyResp.isOk());
    }

    // 9. Privilege Escalation Defense on OTP Signup
    @Test
    @DisplayName("9. Privilege Escalation Defense -> Role defaults to SEEKER and cannot be ADMIN")
    void testClientCannotEscalateRoleOnOtpSignup() {
        String email = "otp_signup_escalate_" + UUID.randomUUID() + "@seedhaproperties.com";
        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("SIGNUP");
        req.setRole("ADMIN"); // Malicious client attempt
        otpService.requestOtp(req, "192.168.1.18", "JUnit-Test");

        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(email);
        verifyReq.setPurpose("SIGNUP");
        verifyReq.setOtp(capturedOtp);
        verifyReq.setFullName("Attacker Escalate");

        OtpResponseDto verifyResp = otpService.verifyOtp(verifyReq, "192.168.1.18", "JUnit-Test");
        assertTrue(verifyResp.isOk());
        assertEquals("SEEKER", verifyResp.getAuth().getUser().getRole());

        User created = userRepository.findByEmail(email).orElseThrow();
        assertEquals("SEEKER", created.getRole());
    }

    // 10. Plaintext Secret Protection in Database
    @Test
    @DisplayName("10. Plaintext Protection -> Database stores only SHA-256 hash and salt")
    void testOtpValueNeverPlaintextInDatabase() {
        String email = "otp_plaintext_check_" + UUID.randomUUID() + "@seedhaproperties.com";
        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("LOGIN");
        otpService.requestOtp(req, "192.168.1.19", "JUnit-Test");

        OtpChallenge challenge = otpChallengeRepository
                .findTopByContactAndPurposeAndIsConsumedFalseOrderByCreatedAtDesc(email, "LOGIN")
                .orElseThrow();

        // Plaintext OTP is 6 digits; hash is 64 hex characters (SHA-256)
        assertNotEquals(capturedOtp, challenge.getOtpHash());
        assertEquals(64, challenge.getOtpHash().length());
        assertNotNull(challenge.getSalt());
        assertEquals(64, challenge.getSalt().length());
    }

    // 11. Password Reset via OTP
    @Test
    @DisplayName("11. Password Reset via OTP -> Updates password and issues fresh tokens")
    void testPasswordResetViaOtp() {
        String email = "otp_pwd_reset_" + UUID.randomUUID() + "@seedhaproperties.com";
        User user = new User(email, passwordEncoder.encode("OldPassword123!"), "Reset User", null, "SEEKER");
        userRepository.save(user);

        OtpRequestDto req = new OtpRequestDto();
        req.setContact(email);
        req.setPurpose("PASSWORD_RESET");
        otpService.requestOtp(req, "192.168.1.20", "JUnit-Test");

        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(email);
        verifyReq.setPurpose("PASSWORD_RESET");
        verifyReq.setOtp(capturedOtp);
        verifyReq.setNewPassword("NewSecurePassword456!");

        OtpResponseDto verifyResp = otpService.verifyOtp(verifyReq, "192.168.1.20", "JUnit-Test");
        assertTrue(verifyResp.isOk());

        // Verify user password hash was updated in DB
        User updated = userRepository.findByEmail(email).orElseThrow();
        assertTrue(passwordEncoder.matches("NewSecurePassword456!", updated.getPasswordHash()));
        assertFalse(passwordEncoder.matches("OldPassword123!", updated.getPasswordHash()));
    }

    // 12. Account Enumeration Resistance
    @Test
    @DisplayName("12. Account Enumeration Resistance -> Generic response for both existing and new contacts")
    void testAccountEnumerationProtection() {
        String existingEmail = "otp_enum_exist_" + UUID.randomUUID() + "@seedhaproperties.com";
        userRepository.save(new User(existingEmail, passwordEncoder.encode("Pass1!"), "Existing User", null, "SEEKER"));

        String nonExistingEmail = "otp_enum_nonexist_" + UUID.randomUUID() + "@seedhaproperties.com";

        OtpRequestDto req1 = new OtpRequestDto();
        req1.setContact(existingEmail);
        OtpResponseDto resp1 = otpService.requestOtp(req1, "192.168.1.21", "JUnit-Test");

        OtpRequestDto req2 = new OtpRequestDto();
        req2.setContact(nonExistingEmail);
        OtpResponseDto resp2 = otpService.requestOtp(req2, "192.168.1.22", "JUnit-Test");

        assertTrue(resp1.isOk());
        assertTrue(resp2.isOk());
        assertEquals(resp1.getMessage(), resp2.getMessage());
    }

    // 13. Phone Number Normalization & Verification
    @Test
    @DisplayName("13. Phone Number Normalization & Verification")
    void testPhoneOtpVerification() {
        // A fixed-width 6-digit suffix. The previous version built the raw phone
        // from randomDigits/1000 and randomDigits%1000, which dropped leading
        // zeros (e.g. %1000 == 42 became "42"), so the raw and normalized phones
        // stopped matching whenever the low group was < 100 — a ~10% flake.
        int randomDigits = 100000 + (int) (Math.random() * 900000); // always 6 digits
        String suffix = String.valueOf(randomDigits); // e.g. "612345"
        String rawPhone = "+91 (98) " + suffix.substring(0, 3) + "-" + suffix.substring(3);
        String normalizedPhone = "+9198" + suffix;

        OtpRequestDto req = new OtpRequestDto();
        req.setContact(rawPhone);
        req.setPurpose("LOGIN");
        OtpResponseDto reqResp = otpService.requestOtp(req, "192.168.1.23", "JUnit-Test");
        assertTrue(reqResp.isOk());

        OtpVerifyDto verifyReq = new OtpVerifyDto();
        verifyReq.setContact(normalizedPhone);
        verifyReq.setPurpose("LOGIN");
        verifyReq.setOtp(capturedOtp);

        OtpResponseDto verifyResp = otpService.verifyOtp(verifyReq, "192.168.1.23", "JUnit-Test");
        assertTrue(verifyResp.isOk());
        assertNotNull(verifyResp.getAuth().getAccessToken());
    }
}
