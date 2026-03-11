package com.priyanshu.hospitalmanagement.security;

import com.priyanshu.hospitalmanagement.dto.LoginRequestDto;
import com.priyanshu.hospitalmanagement.dto.LoginResponseDto;
import com.priyanshu.hospitalmanagement.dto.SignUpRequestDto;
import com.priyanshu.hospitalmanagement.dto.SignupResponseDto;
import com.priyanshu.hospitalmanagement.entity.Patient;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.entity.type.RoleType;
import com.priyanshu.hospitalmanagement.repository.PatientRepository;
import com.priyanshu.hospitalmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JWTService jwtService;

    // REGISTER

    @Transactional
    public SignupResponseDto signup(SignUpRequestDto dto) {

        if (userRepository.existsByUsername(dto.getUsername())) {
            throw new RuntimeException("User already exists");
        }

        User user = User.builder()
                .username(dto.getUsername())
                .password(passwordEncoder.encode(dto.getPassword()))
                .roles(Set.of(RoleType.PATIENT))
                .build();

        userRepository.save(user);

        return new SignupResponseDto(user.getId(), user.getUsername());
    }

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
        String token = jwtService.generateToken(user);
        return new LoginResponseDto(token, user.getId());

    }
}