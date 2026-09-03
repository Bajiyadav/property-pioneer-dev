package com.seedha.properties.controller;

import com.seedha.properties.dto.OtpRequestDto;
import com.seedha.properties.dto.OtpResponseDto;
import com.seedha.properties.dto.OtpVerifyDto;
import com.seedha.properties.service.OtpService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/auth/otp")
public class OtpController {

    private final OtpService otpService;

    public OtpController(OtpService otpService) {
        this.otpService = otpService;
    }

    @PostMapping("/request")
    public ResponseEntity<OtpResponseDto> requestOtp(
            @RequestBody OtpRequestDto requestDto,
            HttpServletRequest request) {

        String ipAddress = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        OtpResponseDto response = otpService.requestOtp(requestDto, ipAddress, userAgent);
        if (!response.isOk()) {
            if (response.getMessage().toLowerCase().contains("too many") || response.getMessage().toLowerCase().contains("wait")) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(response);
            }
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend")
    public ResponseEntity<OtpResponseDto> resendOtp(
            @RequestBody OtpRequestDto requestDto,
            HttpServletRequest request) {

        return requestOtp(requestDto, request);
    }

    @PostMapping("/verify")
    public ResponseEntity<OtpResponseDto> verifyOtp(
            @RequestBody OtpVerifyDto verifyDto,
            HttpServletRequest request) {

        String ipAddress = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        OtpResponseDto response = otpService.verifyOtp(verifyDto, ipAddress, userAgent);
        if (!response.isOk()) {
            if (response.getMessage().toLowerCase().contains("already been used") ||
                response.getMessage().toLowerCase().contains("maximum verification") ||
                response.getMessage().toLowerCase().contains("expired") ||
                response.getMessage().toLowerCase().contains("invalid")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    private String extractClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
