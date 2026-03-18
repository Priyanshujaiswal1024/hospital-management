package com.priyanshu.hospitalmanagement.security;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.entity.type.RoleType;
import com.priyanshu.hospitalmanagement.repository.UserRepository;
import com.priyanshu.hospitalmanagement.service.EmailService;
import com.priyanshu.hospitalmanagement.service.OtpService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository         userRepository;
    private final PasswordEncoder        passwordEncoder;
    private final EmailService           emailService;
    private final OtpService             otpService;
    private final AuthenticationManager  authenticationManager;
    private final JWTService             jwtService;

    // Backend rate-limit: email → next allowed resend time
    private final Map<String, LocalDateTime> resendCooldownMap = new ConcurrentHashMap<>();

    // ───────────────────────────────────────────────────────────────────────
    // SIGNUP
    // ✅ Pre-check duplicate email AND phone BEFORE any DB insert
    //    so MySQL constraint violations never reach the frontend
    // ───────────────────────────────────────────────────────────────────────
    public String signup(SignUpRequestDto dto) {

        // ✅ 1. Check duplicate email — clean, readable error
        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("An account with this email already exists. Try logging in instead.");
        }

        // ✅ 2. Check duplicate phone BEFORE insert — prevents raw SQL from leaking
        if (dto.getPhone() != null && !dto.getPhone().isBlank()
                && userRepository.existsByPhone(dto.getPhone())) {
            throw new RuntimeException("This phone number is already registered with another account.");
        }

        String rawOtp    = otpService.generateOtp();
        String hashedOtp = passwordEncoder.encode(rawOtp);   // store hashed OTP

        User user = User.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .emailVerified(false)
                .otp(hashedOtp)
                .otpExpiry(LocalDateTime.now().plusMinutes(5))
                .roles(Set.of(RoleType.PATIENT))
                .build();

        userRepository.save(user);
        emailService.sendOtp(dto.getUsername(), rawOtp);

        return "User created. OTP sent to email.";
    }

    // ───────────────────────────────────────────────────────────────────────
    // VERIFY OTP → returns JWT so frontend auto-logs in
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public LoginResponseDto verifyOtp(VerifyOtpRequestDto dto) {

        User user = userRepository.findByUsername(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(dto.getOtp(), user.getOtp())) {
            throw new RuntimeException("Invalid OTP. Please check and try again.");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        user.setEmailVerified(true);
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new LoginResponseDto(token, user.getId());
    }

    // ───────────────────────────────────────────────────────────────────────
    // RESEND OTP (60-second backend cooldown)
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public String resendOtp(String email) {

        LocalDateTime allowed = resendCooldownMap.get(email);
        if (allowed != null && LocalDateTime.now().isBefore(allowed)) {
            long secondsLeft = java.time.Duration.between(LocalDateTime.now(), allowed).getSeconds();
            throw new RuntimeException("Please wait " + secondsLeft + "s before resending.");
        }

        User user = userRepository.findByUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String rawOtp    = otpService.generateOtp();
        String hashedOtp = passwordEncoder.encode(rawOtp);

        user.setOtp(hashedOtp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendOtp(email, rawOtp);
        resendCooldownMap.put(email, LocalDateTime.now().plusSeconds(60));

        return "OTP resent successfully";
    }

    // ───────────────────────────────────────────────────────────────────────
    // LOGIN
    // ───────────────────────────────────────────────────────────────────────
    public LoginResponseDto login(LoginRequestDto dto) {

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword())
        );

        User user = userRepository.findByUsername(dto.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        if (user.getRoles().contains(RoleType.PATIENT) && !user.isEmailVerified()) {
            throw new RuntimeException("Please verify your email before logging in.");
        }

        String token = jwtService.generateToken(user);
        return new LoginResponseDto(token, user.getId());
    }

    // ───────────────────────────────────────────────────────────────────────
    // CHANGE PASSWORD (authenticated)
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public String changePassword(ChangePasswordRequestDto dto, String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        return "Password changed successfully";
    }

    // ───────────────────────────────────────────────────────────────────────
    // FORGOT PASSWORD
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public String forgotPassword(String email) {

        LocalDateTime allowed = resendCooldownMap.get(email + "_forgot");
        if (allowed != null && LocalDateTime.now().isBefore(allowed)) {
            long secondsLeft = java.time.Duration.between(LocalDateTime.now(), allowed).getSeconds();
            throw new RuntimeException("Please wait " + secondsLeft + "s before requesting again.");
        }

        User user = userRepository.findByUsername(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email address."));

        String rawOtp    = otpService.generateOtp();
        String hashedOtp = passwordEncoder.encode(rawOtp);

        user.setOtp(hashedOtp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
        userRepository.save(user);

        emailService.sendOtp(email, rawOtp);
        resendCooldownMap.put(email + "_forgot", LocalDateTime.now().plusSeconds(60));

        return "OTP sent to email";
    }

    // ───────────────────────────────────────────────────────────────────────
    // RESET PASSWORD
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public String resetPassword(ResetPasswordRequestDto dto) {

        User user = userRepository.findByUsername(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(dto.getOtp(), user.getOtp())) {
            throw new RuntimeException("Invalid OTP. Please check and try again.");
        }
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        user.setOtp(null);
        user.setOtpExpiry(null);
        userRepository.save(user);

        resendCooldownMap.remove(dto.getEmail() + "_forgot");

        return "Password reset successfully";
    }
}