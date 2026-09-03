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

    public AuthService(UserRepository userRepository,
                       RefreshTokenRepository refreshTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse handleAuthRequest(AuthRequest request, UserPrincipal currentUser) {
        String action = request.getAction() != null ? request.getAction().toLowerCase() : "login";

        return switch (action) {
            case "signup" -> signup(request);
            case "login" -> login(request);
            case "refresh" -> refresh(request);
            case "logout" -> logout(request, currentUser);
            case "session" -> getSession(currentUser);
            default -> AuthResponse.error("Unsupported auth action: " + action);
        };
    }

    private AuthResponse signup(AuthRequest request) {
        if (request.getEmail() == null || request.getPassword() == null || request.getFullName() == null) {
            return AuthResponse.error("Email, password, and full name are required");
        }

        if (userRepository.existsByEmail(request.getEmail().toLowerCase())) {
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
        return issueTokenPair(saved, request.getDeviceInfo());
    }

    private AuthResponse login(AuthRequest request) {
        if (request.getEmail() == null || request.getPassword() == null) {
            return AuthResponse.error("Email and password are required");
        }

        Optional<User> userOpt = userRepository.findByEmail(request.getEmail().toLowerCase());
        if (userOpt.isEmpty() || !passwordEncoder.matches(request.getPassword(), userOpt.get().getPasswordHash())) {
            return AuthResponse.error("Invalid email or password");
        }

        User user = userOpt.get();
        return issueTokenPair(user, request.getDeviceInfo());
    }

    private AuthResponse refresh(AuthRequest request) {
        String rawRefreshToken = request.getRefreshToken();
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return AuthResponse.error("Refresh token is required");
        }

        String tokenHash = jwtTokenProvider.hashRefreshToken(rawRefreshToken);
        Optional<RefreshToken> tokenRecordOpt = refreshTokenRepository.findByTokenHash(tokenHash);

        if (tokenRecordOpt.isEmpty()) {
            return AuthResponse.error("Invalid or revoked refresh token");
        }

        RefreshToken tokenRecord = tokenRecordOpt.get();
        if (tokenRecord.getExpiresAt().isBefore(OffsetDateTime.now())) {
            refreshTokenRepository.delete(tokenRecord);
            return AuthResponse.error("Refresh token has expired. Please log in again.");
        }

        Optional<User> userOpt = userRepository.findById(tokenRecord.getUserId());
        if (userOpt.isEmpty()) {
            refreshTokenRepository.delete(tokenRecord);
            return AuthResponse.error("User not found");
        }

        User user = userOpt.get();

        // Refresh token rotation: delete old token before issuing new token pair
        refreshTokenRepository.delete(tokenRecord);

        return issueTokenPair(user, request.getDeviceInfo());
    }

    private AuthResponse logout(AuthRequest request, UserPrincipal currentUser) {
        if (request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            String tokenHash = jwtTokenProvider.hashRefreshToken(request.getRefreshToken());
            refreshTokenRepository.deleteByTokenHash(tokenHash);
        } else if (currentUser != null) {
            refreshTokenRepository.deleteByUserId(currentUser.getId());
        }
        return AuthResponse.success(null, null, null, null, null, null, null);
    }

    private AuthResponse getSession(UserPrincipal currentUser) {
        if (currentUser == null) {
            return AuthResponse.error("Not authenticated");
        }
        return AuthResponse.success(null, null, null, currentUser.getId(), currentUser.getEmail(), currentUser.getFullName(), currentUser.getRole());
    }

    private AuthResponse issueTokenPair(User user, String deviceInfo) {
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
