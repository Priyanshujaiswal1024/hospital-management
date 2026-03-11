package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.LoginRequestDto;
import com.priyanshu.hospitalmanagement.dto.LoginResponseDto;
import com.priyanshu.hospitalmanagement.dto.SignUpRequestDto;
import com.priyanshu.hospitalmanagement.dto.SignupResponseDto;
import com.priyanshu.hospitalmanagement.security.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto) {
        return ResponseEntity.ok(authService.login(loginRequestDto));
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponseDto> signup(@RequestBody SignUpRequestDto signupRequestDto) {
        return ResponseEntity.ok(authService.signup(signupRequestDto));
    }
    @GetMapping("/encode")
    public String encode(@RequestParam String password) {
        return passwordEncoder.encode(password);
    }
}
