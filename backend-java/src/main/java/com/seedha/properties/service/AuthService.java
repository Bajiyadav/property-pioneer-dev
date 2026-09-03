package com.seedha.properties.service;

import com.seedha.properties.dto.AuthRequest;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.entity.RefreshToken;
import com.seedha.properties.entity.User;
import com.seedha.properties.repository.RefreshTokenRepository;
import com.seedha.properties.repository.UserRepository;
import com.seedha.properties.security.JwtTokenProvider;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final SecurityAuditService auditService;

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       SecurityAuditService auditService) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.auditService = auditService;
    }

    @Transactional
    public AuthResponse handleAuthRequest(AuthRequest request, UserPrincipal currentUser) {
        String action = request.getAction() != null ? request.getAction().toLowerCase() : "login";

        return switch (action) {
            case "signup" -> signup(request);
            case "login" -> login(request);
            case "refresh" -> refresh(request);
            case "logout" -> logout(request, currentUser);
            case "logout_all", "logout-all" -> logoutAll(request, currentUser);
            case "session" -> getSession(currentUser);
            default -> AuthResponse.error("Unsupported auth action: " + action);
        };
    }

    private AuthResponse signup(AuthRequest request) {
        if (request.getEmail() == null || request.getPassword() == null || request.getFullName() == null) {
            return AuthResponse.error("Email, password, and full name are required");
        }

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
            auditService.logSecurityEvent("SIGNUP_CONFLICT", null, null, null, "{\"email\":\"" + request.getEmail().toLowerCase() + "\"}");
            return AuthResponse.error("An account with this email already exists");
        }

        String hashedPassword = passwordEncoder.encode(request.getPassword());
        User newUser = new User(
                request.getEmail().toLowerCase(),
                hashedPassword,
                request.getFullName(),
                request.getPhone(),
                request.getRole()
        );

        User saved = userRepository.save(newUser);
        auditService.logSecurityEvent("SIGNUP_SUCCESS", saved.getId(), null, null, "{\"role\":\"" + saved.getRole() + "\"}");
        return issueTokenPair(saved, UUID.randomUUID(), request.getDeviceInfo());
    }

    private AuthResponse login(AuthRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return AuthResponse.error("Email and password are required");
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().toLowerCase());
        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {
            auditService.logSecurityEvent("LOGIN_FAILURE", null, null, null, "{\"email\":\"" + request.getEmail().toLowerCase() + "\"}");
            return AuthResponse.error("Invalid email or password");
        }

        User user = userOpt.get();
        auditService.logSecurityEvent("LOGIN_SUCCESS", user.getId(), null, null, "{\"role\":\"" + user.getRole() + "\"}");
        return issueTokenPair(user, UUID.randomUUID(), request.getDeviceInfo());
    }

    @Transactional
    public AuthResponse refresh(AuthRequest request) {
        String rawRefreshToken = request.getRefreshToken();
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return AuthResponse.error("Refresh token is required");
        }

        String tokenHash = jwtTokenProvider.hashRefreshToken(rawRefreshToken);
        Optional<RefreshToken> tokenRecordOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenRecordOpt.isEmpty()) {
            auditService.logSecurityEvent("REFRESH_FAILED_UNKNOWN_TOKEN", null, null, null, "{}");
            return AuthResponse.error("Invalid or revoked refresh token");
        }

        RefreshToken tokenRecord = tokenRecordOpt.get();

        // 🚨 TOKEN REUSE DETECTION & FAMILY REVOCATION
        if (tokenRecord.isRevoked()) {
            auditService.logSecurityEvent("TOKEN_REUSE_DETECTED", tokenRecord.getUserId(), null, null,
                    "{\"family_id\":\"" + tokenRecord.getFamilyId() + "\"}");

            // Revoke all tokens in this compromised family immediately
            refreshTokenRepository.revokeFamily(tokenRecord.getFamilyId(), OffsetDateTime.now());

            return AuthResponse.error("Token reuse detected. All sessions in this family have been revoked for security.");
        }

        // Expiration check
        if (tokenRecord.getExpiresAt().isBefore(OffsetDateTime.now())) {
            tokenRecord.setRevoked(true);
            tokenRecord.setRevokedAt(OffsetDateTime.now());
            refreshTokenRepository.save(tokenRecord);
            return AuthResponse.error("Refresh token has expired. Please log in again.");
        }

        Optional<User> userOpt = userRepository.findById(tokenRecord.getUserId());
        if (userOpt.isEmpty()) {
            tokenRecord.setRevoked(true);
            tokenRecord.setRevokedAt(OffsetDateTime.now());
            refreshTokenRepository.save(tokenRecord);
            return AuthResponse.error("User not found");
        }

        User user = userOpt.get();

        // Generate new rotated token pair
        String newRawRefreshToken = jwtTokenProvider.generateRawRefreshToken();
        String newTokenHash = jwtTokenProvider.hashRefreshToken(newRawRefreshToken);
        OffsetDateTime expiresAt = OffsetDateTime.now().plusSeconds(jwtTokenProvider.getRefreshTokenExpirationMs() / 1000L);

        // Invalidate old token and link to replacement
        tokenRecord.setRevoked(true);
        tokenRecord.setRevokedAt(OffsetDateTime.now());
        tokenRecord.setReplacedByHash(newTokenHash);
        refreshTokenRepository.save(tokenRecord);

        // Save new token in same family
        RefreshToken newTokenEntity = new RefreshToken(
                user.getId(),
                tokenRecord.getFamilyId(),
                newTokenHash,
                request.getDeviceInfo(),
                expiresAt
        );
        refreshTokenRepository.save(newTokenEntity);

        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );

        auditService.logSecurityEvent("TOKEN_REFRESH_SUCCESS", user.getId(), null, null,
                "{\"family_id\":\"" + tokenRecord.getFamilyId() + "\"}");

        return AuthResponse.success(
                newAccessToken,
                newRawRefreshToken,
                jwtTokenProvider.getAccessTokenExpirationSeconds(),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }

    @Transactional
    public AuthResponse logout(AuthRequest request, UserPrincipal currentUser) {
        if (request.isLogoutAll()) {
            return logoutAll(request, currentUser);
        }

        if (request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            String tokenHash = jwtTokenProvider.hashRefreshToken(request.getRefreshToken());
            Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);
            if (tokenOpt.isPresent()) {
                RefreshToken token = tokenOpt.get();
                token.setRevoked(true);
                token.setRevokedAt(OffsetDateTime.now());
                refreshTokenRepository.save(token);
                auditService.logSecurityEvent("LOGOUT_SUCCESS", token.getUserId(), null, null, "{\"family_id\":\"" + token.getFamilyId() + "\"}");
            }
        } else if (currentUser != null) {
            refreshTokenRepository.revokeAllForUser(currentUser.getId(), OffsetDateTime.now());
            auditService.logSecurityEvent("LOGOUT_SUCCESS", currentUser.getId(), null, null, "{}");
        }
        return AuthResponse.success(null, null, null, null, null, null, null);
    }

    @Transactional
    public AuthResponse logoutAll(AuthRequest request, UserPrincipal currentUser) {
        UUID userId = null;
        if (currentUser != null) {
            userId = currentUser.getId();
        } else if (request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            String tokenHash = jwtTokenProvider.hashRefreshToken(request.getRefreshToken());
            Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByTokenHash(tokenHash);
            if (tokenOpt.isPresent()) {
                userId = tokenOpt.get().getUserId();
            }
        }

        if (userId != null) {
            refreshTokenRepository.revokeAllForUser(userId, OffsetDateTime.now());
            auditService.logSecurityEvent("LOGOUT_ALL_SUCCESS", userId, null, null, "{}");
        }

        return AuthResponse.success(null, null, null, null, null, null, null);
    }

    private AuthResponse getSession(UserPrincipal currentUser) {
        if (currentUser == null) {
            return AuthResponse.error("Not authenticated");
        }
        return AuthResponse.success(null, null, null, currentUser.getId(), currentUser.getEmail(), currentUser.getFullName(), currentUser.getRole());
    }

    public AuthResponse issueTokenPair(User user, UUID familyId, String deviceInfo) {
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );

        String rawRefreshToken = jwtTokenProvider.generateRawRefreshToken();
        String tokenHash = jwtTokenProvider.hashRefreshToken(rawRefreshToken);
        OffsetDateTime expiresAt = OffsetDateTime.now().plusSeconds(jwtTokenProvider.getRefreshTokenExpirationMs() / 1000L);

        RefreshToken refreshTokenEntity = new RefreshToken(
                user.getId(),
                familyId != null ? familyId : UUID.randomUUID(),
                tokenHash,
                deviceInfo,
                expiresAt
        );
        refreshTokenRepository.save(refreshTokenEntity);

        return AuthResponse.success(
                accessToken,
                rawRefreshToken,
                jwtTokenProvider.getAccessTokenExpirationSeconds(),
                user.getId(),
                user.getEmail(),
                user.getFullName(),
                user.getRole()
        );
    }
}
