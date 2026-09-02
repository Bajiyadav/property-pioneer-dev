package com.seedha.properties.service;

import com.seedha.properties.dto.AuthRequest;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.entity.User;
import com.seedha.properties.repository.UserRepository;
import com.seedha.properties.security.JwtTokenProvider;
import com.seedha.properties.security.UserPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthResponse handleAuthRequest(AuthRequest request, UserPrincipal currentUser) {
        String action = request.getAction() != null ? request.getAction().toLowerCase() : "login";

        return switch (action) {
            case "signup" -> signup(request);
            case "login" -> login(request);
            case "session" -> getSession(currentUser);
            case "logout" -> AuthResponse.success(null, null, null, null, null);
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
        String token = jwtTokenProvider.generateToken(saved.getId(), saved.getEmail(), saved.getFullName(), saved.getRole());

        return AuthResponse.success(token, saved.getId(), saved.getEmail(), saved.getFullName(), saved.getRole());
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
        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getFullName(), user.getRole());

        return AuthResponse.success(token, user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }

    private AuthResponse getSession(UserPrincipal currentUser) {
        if (currentUser == null) {
            return AuthResponse.error("Not authenticated");
        }
        return AuthResponse.success(null, currentUser.getId(), currentUser.getEmail(), currentUser.getFullName(), currentUser.getRole());
    }
}
