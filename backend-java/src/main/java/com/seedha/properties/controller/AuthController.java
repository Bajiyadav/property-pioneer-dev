package com.seedha.properties.controller;

import com.seedha.properties.dto.AuthRequest;
import com.seedha.properties.dto.AuthResponse;
import com.seedha.properties.security.UserPrincipal;
import com.seedha.properties.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping
    public ResponseEntity<AuthResponse> authenticate(
            @RequestBody AuthRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        AuthResponse response = authService.handleAuthRequest(request, currentUser);
        if (!response.isOk()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }
}
