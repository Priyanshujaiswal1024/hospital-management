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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final OtpService otpService;
    private final AuthenticationManager authenticationManager;
    private final JWTService  jwtService;

    public String signup(SignUpRequestDto dto) {

        if (userRepository.findByUsername(dto.getUsername()).isPresent()) {
            throw new RuntimeException("Email already exists");
        }

        String otp = otpService.generateOtp();

        User user = User.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .fullName(dto.getFullName())
                .phone(dto.getPhone())
                .emailVerified(false)
                .otp(otp)
                .roles(Set.of(RoleType.PATIENT))
                .otpExpiry(LocalDateTime.now().plusMinutes(5))

                .build();

        userRepository.save(user);

        emailService.sendOtp(dto.getUsername(), otp);

        return "User created. OTP sent to email.";
    }

    public String verifyOtp(VerifyOtpRequestDto dto) {

        User user = userRepository.findByUsername(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getOtp().equals(dto.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }

        user.setEmailVerified(true);
        user.setOtp(null);

        userRepository.save(user);

        return "Email verified successfully";
    }
//    public String resendOtp(String email) {
//
//        User user = userRepository.findByUsername(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//        String otp = otpService.generateOtp();
//
//        user.setOtp(otp);
//        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
//
//        userRepository.save(user);
//
//        emailService.sendOtp(email, otp);
//
//        return "OTP resent successfully";
//    }
//    public String forgotPassword(String email) {
//
//        User user = userRepository.findByUsername(email)
//                .orElseThrow(() -> new RuntimeException("User not found"));
//
//        String otp = otpService.generateOtp();
//
//        user.setOtp(otp);
//        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));
//
//        userRepository.save(user);
//
//        emailService.sendOtp(email, otp);
//
//        return "OTP sent to email";
//    }
    // LOGIN
    public LoginResponseDto login(LoginRequestDto dto) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        dto.getUsername(),
                        dto.getPassword()
                )
        );

        User user = userRepository.findByUsername(dto.getUsername())
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        if( user.getRoles().contains(RoleType.PATIENT)  &&!user.isEmailVerified()){
            throw new RuntimeException("Please verify email first");
        }
        String token = jwtService.generateToken(user);
        return new LoginResponseDto(token, user.getId());

    }
    @Transactional
    public String changePassword(ChangePasswordRequestDto dto, String username) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // check old password
        if (!passwordEncoder.matches(dto.getOldPassword(), user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        // check new password and confirm password
        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        // update password
        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));

        userRepository.save(user);

        return "Password changed successfully";
    }
    public String forgotPassword(String email) {

        User user = userRepository.findByUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = otpService.generateOtp();

        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);

        emailService.sendOtp(email, otp);

        return "OTP sent to email";
    }
    public String resendOtp(String email) {

        User user = userRepository.findByUsername(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String otp = otpService.generateOtp();

        user.setOtp(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(5));

        userRepository.save(user);

        emailService.sendOtp(email, otp);

        return "OTP resent successfully";
    }
    @Transactional
    public String resetPassword(ResetPasswordRequestDto dto) {

        User user = userRepository.findByUsername(dto.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!user.getOtp().equals(dto.getOtp())) {
            throw new RuntimeException("Invalid OTP");
        }

        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP expired");
        }

        if (!dto.getNewPassword().equals(dto.getConfirmPassword())) {
            throw new RuntimeException("Passwords do not match");
        }

        user.setPassword(passwordEncoder.encode(dto.getNewPassword()));

        user.setOtp(null);
        user.setOtpExpiry(null);

        userRepository.save(user);

        return "Password reset successfully";
    }
}