package com.priyanshu.hospitalmanagement.security;

import com.priyanshu.hospitalmanagement.dto.LoginResponseDto;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Slf4j
@Component
// ❌ @RequiredArgsConstructor hatao — @Lazy ke saath kaam nahi karta
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;

    // ✅ Manual constructor with @Lazy
    public OAuth2SuccessHandler(@Lazy AuthService authService) {
        this.authService = authService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User           = (OAuth2User) authentication.getPrincipal();
        String registrationId           = token.getAuthorizedClientRegistrationId();

        log.info("OAuth2 login success — provider: {}", registrationId);

        LoginResponseDto loginResponse =
                authService.handleOAuth2LoginRequest(oAuth2User, registrationId);

        String jwt = loginResponse.getJwt();

        String redirectUrl = "http://localhost:5173/oauth2/callback?token=" + jwt;
        response.sendRedirect(redirectUrl);

    }
}