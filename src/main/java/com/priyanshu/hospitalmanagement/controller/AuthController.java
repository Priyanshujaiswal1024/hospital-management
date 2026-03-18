package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.security.AuthService;
import com.priyanshu.hospitalmanagement.service.TokenBlacklist;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService    authService;
    private final TokenBlacklist tokenBlacklist;

    // ── SIGNUP ──────────────────────────────────────────────────────────────
    @PostMapping("/signup")
    public ResponseEntity<String> signup(@RequestBody SignUpRequestDto dto) {
        return ResponseEntity.ok(authService.signup(dto));
    }

    // ── VERIFY OTP  →  returns JWT (auto-login after email verification) ✅ ──
    @PostMapping("/verify-otp")
    public ResponseEntity<LoginResponseDto> verifyOtp(@RequestBody VerifyOtpRequestDto dto) {
        return ResponseEntity.ok(authService.verifyOtp(dto));
    }

    // ── RESEND OTP ──────────────────────────────────────────────────────────
    @PostMapping("/resend-otp")
    public ResponseEntity<String> resendOtp(@RequestParam String email) {
        return ResponseEntity.ok(authService.resendOtp(email));
    }

    // ── LOGIN ───────────────────────────────────────────────────────────────
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    // ── FORGOT PASSWORD ─────────────────────────────────────────────────────
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam String email) {
        return ResponseEntity.ok(authService.forgotPassword(email));
    }

    // ── RESET PASSWORD ──────────────────────────────────────────────────────
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequestDto dto) {
        return ResponseEntity.ok(authService.resetPassword(dto));
    }

    // ── CHANGE PASSWORD (authenticated) ─────────────────────────────────────
    @PostMapping("/change-password")
    public ResponseEntity<String> changePassword(
            @RequestBody ChangePasswordRequestDto dto,
            Authentication authentication) {
        return ResponseEntity.ok(authService.changePassword(dto, authentication.getName()));
    }

    // ── LOGOUT (JWT blacklist) ───────────────────────────────────────────────
    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.badRequest().body("No token provided");
        }

        tokenBlacklist.blacklist(authHeader.substring(7));
        return ResponseEntity.ok("Logged out successfully");
    }
}