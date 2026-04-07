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

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository        userRepository;
    private final PasswordEncoder       passwordEncoder;
    private final EmailService          emailService;
    private final OtpService            otpService;
    private final AuthenticationManager authenticationManager;
    private final JWTService            jwtService;

    // In-memory rate-limit map — move to Redis if you need multi-instance support
    private final Map<String, LocalDateTime> resendCooldownMap = new ConcurrentHashMap<>();

    // ───────────────────────────────────────────────────────────────────────
    // SIGNUP
    // ✅ OTP generated and emailed BEFORE saving user — avoids orphaned records
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public String signup(SignUpRequestDto dto) {

        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("An account with this email already exists. Try logging in instead.");
        }

        if (dto.getPhone() != null && !dto.getPhone().isBlank()
                && userRepository.existsByPhone(dto.getPhone())) {
            throw new RuntimeException("This phone number is already registered with another account.");
        }

        // ✅ Generate OTP first — if email send fails, we never persist the user
        String otp = otpService.generateAndSaveOtp(dto.getUsername());
        emailService.sendOtp(dto.getUsername(), otp); // throws on failure → user not saved

        User user = User.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .emailVerified(false)
                .roles(Set.of(RoleType.PATIENT))
                .build();

        userRepository.save(user);
        return "User created. OTP sent to email.";
    }

    // ───────────────────────────────────────────────────────────────────────
    // VERIFY OTP → returns JWT so frontend auto-logs in
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public LoginResponseDto verifyOtp(VerifyOtpRequestDto dto) {

        User user = userRepository.findByUsername(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // verifyAndDelete: validates + removes key atomically (one-time use)
        if (!otpService.verifyAndDelete(dto.getEmail(), dto.getOtp())) {
            throw new RuntimeException("Invalid or expired OTP. Please request a new one.");
        }

        user.setEmailVerified(true);
        userRepository.save(user);

        String token = jwtService.generateToken(user);
        return new LoginResponseDto(token, user.getId());
    }

    // ───────────────────────────────────────────────────────────────────────
    // RESEND OTP (60-second backend cooldown)
    // ───────────────────────────────────────────────────────────────────────
    public String resendOtp(String email) { // ✅ removed unnecessary @Transactional

        LocalDateTime allowed = resendCooldownMap.get(email);
        if (allowed != null && LocalDateTime.now().isBefore(allowed)) {
            long secondsLeft = Duration.between(LocalDateTime.now(), allowed).getSeconds();
            throw new RuntimeException("Please wait " + secondsLeft + "s before resending.");
        }

        userRepository.findByUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = otpService.generateAndSaveOtp(email); // overwrites old key, resets TTL
        emailService.sendOtp(email, otp);
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
    public String forgotPassword(String email) { // ✅ removed unnecessary @Transactional

        LocalDateTime allowed = resendCooldownMap.get(email + "_forgot");
        if (allowed != null && LocalDateTime.now().isBefore(allowed)) {
            long secondsLeft = Duration.between(LocalDateTime.now(), allowed).getSeconds();
            throw new RuntimeException("Please wait " + secondsLeft + "s before requesting again.");
        }

        userRepository.findByUsername(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email address."));

        String otp = otpService.generateAndSaveOtp(email + "_forgot"); // scoped key
        emailService.sendOtp(email, otp);
        resendCooldownMap.put(email + "_forgot", LocalDateTime.now().plusSeconds(60));

        return "OTP sent to email";
    }

    // ───────────────────────────────────────────────────────────────────────
    // RESET PASSWORD
    // ✅ Validate passwords BEFORE consuming OTP — prevents wasted OTP on mismatch
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public String resetPassword(ResetPasswordRequestDto dto) {

        userRepository.findByUsername(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // ✅ Check passwords match BEFORE burning the OTP
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        if (!otpService.verifyAndDelete(dto.getEmail() + "_forgot", dto.getOtp())) {
            throw new RuntimeException("Invalid or expired OTP. Please request a new one.");
        }

        User user = userRepository.findByUsername(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        userRepository.save(user);

        resendCooldownMap.remove(dto.getEmail() + "_forgot");

        return "Password reset successfully";
    }

    // ───────────────────────────────────────────────────────────────────────
    // OAUTH2 LOGIN
    // ───────────────────────────────────────────────────────────────────────
    @Transactional
    public LoginResponseDto handleOAuth2LoginRequest(
            org.springframework.security.oauth2.core.user.OAuth2User oAuth2User,
            String registrationId) {

        String email    = oAuth2User.getAttribute("email");
        String fullName = oAuth2User.getAttribute("name");

        if (email == null) {
            throw new RuntimeException("Email not received from " + registrationId);
        }

        User user = userRepository.findByUsername(email).orElseGet(() -> {
            User newUser = User.builder()
                    .username(email)
                    .fullName(fullName)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .phone(null)
                    .emailVerified(true)
                    .roles(Set.of(RoleType.PATIENT))
                    .build();
            return userRepository.save(newUser);
        });

        if (!user.isEmailVerified()) {
            user.setEmailVerified(true);
            userRepository.save(user);
        }

        String token = jwtService.generateToken(user);
        return new LoginResponseDto(token, user.getId());
    }
}