package com.seedha.properties.service;

import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.dto.OtpRequestDto;
import com.seedha.properties.dto.OtpResponseDto;
import com.seedha.properties.dto.OtpVerifyDto;
import com.seedha.properties.entity.OtpChallenge;
import com.seedha.properties.entity.User;
import com.seedha.properties.repository.OtpChallengeRepository;
import com.seedha.properties.repository.RefreshTokenRepository;
import com.seedha.properties.repository.UserRepository;
import com.seedha.properties.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
public class OtpService {

    private static final Logger logger = LoggerFactory.getLogger(OtpService.class);

    private static final int OTP_LIFETIME_SECONDS = 300; // 5 minutes
    private static final int COOLDOWN_SECONDS = 60;       // 60 seconds resend cooldown
    private static final int MAX_ATTEMPTS = 5;
    private static final int HOURLY_CONTACT_LIMIT = 5;
    private static final int HOURLY_IP_LIMIT = 10;

    private final SecureRandom secureRandom = new SecureRandom();
    private final OtpChallengeRepository otpChallengeRepository;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SecurityAuditService auditService;
    private final OtpDeliveryService deliveryService;
    private final AuthService authService;

    public OtpService(OtpChallengeRepository otpChallengeRepository,
                      UserRepository userRepository,
                      RefreshTokenRepository refreshTokenRepository,
                      PasswordEncoder passwordEncoder,
                      JwtTokenProvider jwtTokenProvider,
                      SecurityAuditService auditService,
                      OtpDeliveryService deliveryService,
                      AuthService authService) {
        this.otpChallengeRepository = otpChallengeRepository;
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.auditService = auditService;
        this.deliveryService = deliveryService;
        this.authService = authService;
    }

    @Transactional
    public OtpResponseDto requestOtp(OtpRequestDto request, String ipAddress, String userAgent) {
        if (request.getContact() == null || request.getContact().isBlank()) {
            return OtpResponseDto.error("Contact identifier is required");
        }

        String normalizedContact = normalizeContact(request.getContact());
        String contactType = determineContactType(normalizedContact, request.getContactType());
        String purpose = request.getPurpose() != null ? request.getPurpose().toUpperCase() : "LOGIN";
        String redactedContact = redactContact(normalizedContact);

        OffsetDateTime oneHourAgo = OffsetDateTime.now().minusHours(1);

        // 1. Rate Limiting by IP
        if (ipAddress != null && !ipAddress.isBlank()) {
            long ipCount = otpChallengeRepository.countByIpAddressAndCreatedAtAfter(ipAddress, oneHourAgo);
            if (ipCount >= HOURLY_IP_LIMIT) {
                auditService.logSecurityEvent("OTP_RATE_LIMIT_EXCEEDED", null, ipAddress, userAgent,
                        "{\"target\":\"ip\",\"limit\":" + HOURLY_IP_LIMIT + "}");
                return OtpResponseDto.error("Too many requests from this network. Please wait and try again later.");
            }
        }

        // 2. Rate Limiting by Contact
        long contactCount = otpChallengeRepository.countByContactAndCreatedAtAfter(normalizedContact, oneHourAgo);
        if (contactCount >= HOURLY_CONTACT_LIMIT) {
            auditService.logSecurityEvent("OTP_RATE_LIMIT_EXCEEDED", null, ipAddress, userAgent,
                    "{\"target\":\"contact\",\"contact\":\"" + redactedContact + "\"}");
            return OtpResponseDto.error("Too many OTP requests for this contact. Please try again later.");
        }

        // 3. Resend Cooldown Check
        Optional<OtpChallenge> latestChallengeOpt = otpChallengeRepository
                .findTopByContactAndPurposeAndIsConsumedFalseOrderByCreatedAtDesc(normalizedContact, purpose);

        if (latestChallengeOpt.isPresent()) {
            OtpChallenge latest = latestChallengeOpt.get();
            if (latest.getCreatedAt() != null) {
                OffsetDateTime cooldownExpiry = latest.getCreatedAt().plusSeconds(COOLDOWN_SECONDS);
                if (OffsetDateTime.now().isBefore(cooldownExpiry)) {
                    long remainingSeconds = java.time.Duration.between(OffsetDateTime.now(), cooldownExpiry).toSeconds();
                    return OtpResponseDto.error("Please wait " + (remainingSeconds + 1) + " seconds before requesting a new code.");
                }
            }
        }

        // 4. Invalidate any existing active challenges for this contact + purpose
        otpChallengeRepository.invalidateExistingChallenges(normalizedContact, purpose, OffsetDateTime.now());

        // 5. Cryptographically Secure 6-Digit OTP Generation
        int otpNumber = secureRandom.nextInt(900000) + 100000;
        String rawOtp = String.valueOf(otpNumber);

        // 6. Generate 32-byte cryptographic salt and hash
        byte[] saltBytes = new byte[32];
        secureRandom.nextBytes(saltBytes);
        String salt = HexFormat.of().formatHex(saltBytes);
        String otpHash = hashOtp(rawOtp, salt);

        // 7. Store Hashed OTP Record
        OtpChallenge challenge = new OtpChallenge();
        challenge.setContact(normalizedContact);
        challenge.setContactType(contactType);
        challenge.setPurpose(purpose);
        challenge.setOtpHash(otpHash);
        challenge.setSalt(salt);
        challenge.setAttempts(0);
        challenge.setMaxAttempts(MAX_ATTEMPTS);
        challenge.setConsumed(false);
        challenge.setExpiresAt(OffsetDateTime.now().plusSeconds(OTP_LIFETIME_SECONDS));
        challenge.setIpAddress(ipAddress);
        challenge.setUserAgent(userAgent);

        otpChallengeRepository.save(challenge);

        // 8. Dispatch OTP via Delivery Service (never logs raw OTP)
        deliveryService.deliverOtp(normalizedContact, contactType, purpose, rawOtp);

        // 9. Structured Audit Log
        auditService.logSecurityEvent("OTP_REQUESTED", null, ipAddress, userAgent,
                "{\"contact\":\"" + redactedContact + "\",\"purpose\":\"" + purpose + "\"}");

        // 10. Enumeration-Safe Generic Response
        return OtpResponseDto.success(
                "If the account or contact is eligible, a verification code has been sent.",
                COOLDOWN_SECONDS,
                OTP_LIFETIME_SECONDS
        );
    }

    @Transactional
    public OtpResponseDto verifyOtp(OtpVerifyDto request, String ipAddress, String userAgent) {
        if (request.getContact() == null || request.getContact().isBlank()) {
            return OtpResponseDto.error("Contact identifier is required");
        }
        if (request.getOtp() == null || request.getOtp().isBlank()) {
            return OtpResponseDto.error("Verification code is required");
        }

        String normalizedContact = normalizeContact(request.getContact());
        String purpose = request.getPurpose() != null ? request.getPurpose().toUpperCase() : "LOGIN";
        String rawOtp = request.getOtp().trim();
        String redactedContact = redactContact(normalizedContact);

        // 1. Fetch latest active unconsumed challenge
        Optional<OtpChallenge> challengeOpt = otpChallengeRepository
                .findTopByContactAndPurposeAndIsConsumedFalseOrderByCreatedAtDesc(normalizedContact, purpose);

        if (challengeOpt.isEmpty()) {
            auditService.logSecurityEvent("OTP_VERIFY_NOT_FOUND", null, ipAddress, userAgent,
                    "{\"contact\":\"" + redactedContact + "\",\"purpose\":\"" + purpose + "\"}");
            return OtpResponseDto.error("Invalid or expired verification code.");
        }

        OtpChallenge challenge = challengeOpt.get();

        // 2. Check if already consumed (Single-Use Guarantee)
        if (challenge.isConsumed()) {
            auditService.logSecurityEvent("OTP_REUSE_ATTEMPT", null, ipAddress, userAgent,
                    "{\"challenge_id\":\"" + challenge.getId() + "\"}");
            return OtpResponseDto.error("This verification code has already been used. Please request a new one.");
        }

        // 3. Check Expiration
        if (challenge.getExpiresAt().isBefore(OffsetDateTime.now())) {
            challenge.setConsumed(true);
            challenge.setConsumedAt(OffsetDateTime.now());
            otpChallengeRepository.save(challenge);

            auditService.logSecurityEvent("OTP_EXPIRED", null, ipAddress, userAgent,
                    "{\"challenge_id\":\"" + challenge.getId() + "\"}");
            return OtpResponseDto.error("Verification code has expired. Please request a new one.");
        }

        // 4. Check Maximum Attempt Limit
        if (challenge.getAttempts() >= challenge.getMaxAttempts()) {
            challenge.setConsumed(true);
            challenge.setConsumedAt(OffsetDateTime.now());
            otpChallengeRepository.save(challenge);

            auditService.logSecurityEvent("OTP_MAX_ATTEMPTS_EXCEEDED", null, ipAddress, userAgent,
                    "{\"challenge_id\":\"" + challenge.getId() + "\"}");
            return OtpResponseDto.error("Maximum verification attempts exceeded. This code has been invalidated.");
        }

        // 5. Verify Hash
        String expectedHash = challenge.getOtpHash();
        String candidateHash = hashOtp(rawOtp, challenge.getSalt());

        if (!candidateHash.equals(expectedHash)) {
            challenge.setAttempts(challenge.getAttempts() + 1);
            if (challenge.getAttempts() >= challenge.getMaxAttempts()) {
                challenge.setConsumed(true);
                challenge.setConsumedAt(OffsetDateTime.now());
            }
            otpChallengeRepository.save(challenge);

            auditService.logSecurityEvent("OTP_VERIFY_FAILURE", null, ipAddress, userAgent,
                    "{\"challenge_id\":\"" + challenge.getId() + "\",\"attempts\":" + challenge.getAttempts() + "}");
            return OtpResponseDto.error("Invalid verification code.");
        }

        // 6. Successfully Verified — Mark Consumed IMMEDIATELY (Single-Use Defense)
        challenge.setConsumed(true);
        challenge.setConsumedAt(OffsetDateTime.now());
        otpChallengeRepository.save(challenge);

        auditService.logSecurityEvent("OTP_VERIFY_SUCCESS", null, ipAddress, userAgent,
                "{\"contact\":\"" + redactedContact + "\",\"purpose\":\"" + purpose + "\"}");

        // 7. Establish Authentication State Based on Purpose
        AuthResponse authResponse = handlePostVerificationAuth(normalizedContact, purpose, request);
        return OtpResponseDto.successWithAuth("Verification successful", authResponse);
    }

    private AuthResponse handlePostVerificationAuth(String contact, String purpose, OtpVerifyDto request) {
        Optional<User> userOpt = contact.contains("@")
                ? userRepository.findByEmail(contact)
                : userRepository.findFirstByPhoneOrderByCreatedAtDesc(contact);

        if ("SIGNUP".equalsIgnoreCase(purpose)) {
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                return authService.issueTokenPair(user, UUID.randomUUID(), request.getDeviceInfo());
            }

            // Create new verified user (Server enforces role, ignoring any privilege escalation attempt)
            String email = contact.contains("@") ? contact : contact + "@mobile.seedha.internal";
            String phone = contact.contains("@") ? null : contact;
            String fullName = request.getFullName() != null && !request.getFullName().isBlank()
                    ? request.getFullName() : "Verified User";
            String initialPassword = UUID.randomUUID().toString(); // Random unusable placeholder

            User newUser = new User(
                    email,
                    passwordEncoder.encode(initialPassword),
                    fullName,
                    phone,
                    "SEEKER" // Always defaults safely to SEEKER
            );
            User saved = userRepository.save(newUser);
            return authService.issueTokenPair(saved, UUID.randomUUID(), request.getDeviceInfo());
        }

        if ("PASSWORD_RESET".equalsIgnoreCase(purpose)) {
            if (userOpt.isEmpty()) {
                // Deliberately the same wording the request step uses. Saying
                // "user not found" here would confirm which contacts have accounts
                // to anyone who controls the contact, undoing the enumeration
                // protection the OTP request path is careful to provide.
                return AuthResponse.error("Verification could not be completed. Please request a new code.");
            }
            User user = userOpt.get();
            if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
                user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
                userRepository.save(user);

                // Revoke all existing sessions for security
                refreshTokenRepository.revokeAllForUser(user.getId(), OffsetDateTime.now());
            }
            return authService.issueTokenPair(user, UUID.randomUUID(), request.getDeviceInfo());
        }

        // LOGIN flow
        if (userOpt.isEmpty()) {
            // If user does not exist, auto-create verified seeker
            String email = contact.contains("@") ? contact : contact + "@mobile.seedha.internal";
            String phone = contact.contains("@") ? null : contact;
            String fullName = request.getFullName() != null && !request.getFullName().isBlank()
                    ? request.getFullName() : "Seedha User";

            User newUser = new User(
                    email,
                    passwordEncoder.encode(UUID.randomUUID().toString()),
                    fullName,
                    phone,
                    "SEEKER"
            );
            User saved = userRepository.save(newUser);
            return authService.issueTokenPair(saved, UUID.randomUUID(), request.getDeviceInfo());
        }

        User user = userOpt.get();
        return authService.issueTokenPair(user, UUID.randomUUID(), request.getDeviceInfo());
    }

    private String hashOtp(String rawOtp, String salt) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            digest.update(salt.getBytes(StandardCharsets.UTF_8));
            byte[] hash = digest.digest(rawOtp.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }

    private String normalizeContact(String contact) {
        String trimmed = contact.trim().toLowerCase();
        if (trimmed.contains("@")) {
            return trimmed;
        }
        // Normalize phone number (strip whitespace and formatting)
        return trimmed.replaceAll("[^0-9+]", "");
    }

    private String determineContactType(String contact, String requestedType) {
        if (contact.contains("@")) return "EMAIL";
        return "PHONE";
    }

    private String redactContact(String contact) {
        if (contact == null || contact.isBlank()) return "UNKNOWN";
        if (contact.contains("@")) {
            String[] parts = contact.split("@", 2);
            String local = parts[0];
            String domain = parts.length > 1 ? parts[1] : "";
            if (local.length() <= 2) return local.charAt(0) + "***@" + domain;
            return local.substring(0, 2) + "***@" + domain;
        } else if (contact.length() > 4) {
            return contact.substring(0, 2) + "****" + contact.substring(contact.length() - 2);
        }
        return "***";
    }
}
