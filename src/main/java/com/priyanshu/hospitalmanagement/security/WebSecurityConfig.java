////package com.priyanshu.hospitalmanagement.security;
////
////import lombok.RequiredArgsConstructor;
////import org.springframework.context.annotation.Bean;
////import org.springframework.context.annotation.Configuration;
////import org.springframework.http.HttpMethod;
////import org.springframework.security.authentication.AuthenticationManager;
////import org.springframework.security.authentication.AuthenticationProvider;
////import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
////import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
////import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
////import org.springframework.security.config.annotation.web.builders.HttpSecurity;
////import org.springframework.security.config.http.SessionCreationPolicy;
////import org.springframework.security.core.userdetails.UserDetailsService;
////import org.springframework.security.crypto.password.PasswordEncoder;
////import org.springframework.security.web.SecurityFilterChain;
////import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
////import org.springframework.web.cors.CorsConfigurationSource;
////
////import static com.priyanshu.hospitalmanagement.entity.type.PermissionType.*;
////import static com.priyanshu.hospitalmanagement.entity.type.RoleType.*;
////
////@Configuration
////@RequiredArgsConstructor
////@EnableMethodSecurity
////public class WebSecurityConfig {
////
////    private final UserDetailsService userDetailsService;
////    private final JwtAuthFilter jwtAuthFilter;
////    private final PasswordEncoder passwordEncoder;
////    private final CorsConfigurationSource corsConfigurationSource;
////
////    @Bean
////    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
////
////        return http
////                .cors(cors -> cors.configurationSource(corsConfigurationSource))
////                .csrf(csrf -> csrf.disable())
////                .formLogin(form -> form.disable())
////
////                .authorizeHttpRequests(auth -> auth
////
////                        // ── Public endpoints ──────────────────────────────
////                        .requestMatchers(
////                                "/public/**",
////                                "/auth/**",
////                                "/swagger-ui/**",
////                                "/v3/api-docs/**"
////                        ).permitAll()
////
////                        // ── Admin ─────────────────────────────────────────
////                        .requestMatchers(HttpMethod.DELETE, "/admin/**")
////                        .hasAnyAuthority(
////                                APPOINTMENT_DELETE.getPermission(),
////                                USER_MANAGE.getPermission()
////                        )
////                        .requestMatchers("/admin/**")
////                        .hasRole(ADMIN.name())
////
////                        // ── Doctors ───────────────────────────────────────
////                        .requestMatchers("/doctors/**")
////                        .hasAnyRole(DOCTOR.name(), ADMIN.name())
////
////                        // ── Patients ──────────────────────────────────────
////                        .requestMatchers("/patient/**")
////                        .hasRole(PATIENT.name())
////
////                        // ── Prescriptions ─────────────────────────────────
////                        .requestMatchers(HttpMethod.POST, "/prescriptions/**")
////                        .hasRole(DOCTOR.name())
////
////                        .requestMatchers(HttpMethod.GET, "/prescriptions/*/download")
////                        .hasAnyRole(PATIENT.name(), DOCTOR.name())
////
////                        // ── Bills ─────────────────────────────────────────
////                        .requestMatchers(HttpMethod.GET, "/bills/patient", "/bills/patient/**")
////                        .hasRole(PATIENT.name())
////
////                        .requestMatchers(HttpMethod.GET, "/bills/*/download")
////                        .hasRole(PATIENT.name())
////
////                        .requestMatchers(HttpMethod.PATCH, "/bills/*/mark-paid")
////                        .hasRole(ADMIN.name())
////
////                        // ── Medical Records ───────────────────────────────
////                        .requestMatchers(HttpMethod.POST, "/medical-records/**")
////                        .hasAnyRole(DOCTOR.name(), ADMIN.name())
////
////                        .requestMatchers(HttpMethod.GET, "/medical-records/patient/**")
////                        .hasAnyRole(DOCTOR.name(), ADMIN.name(), PATIENT.name())
////
////                        // ── Fallback ──────────────────────────────────────
////                        .anyRequest().authenticated()
////                )
////
////                .sessionManagement(session ->
////                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
////                )
////
////                .authenticationProvider(authenticationProvider())
////                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
////                .build();
////    }
////
////    @Bean
////    public AuthenticationProvider authenticationProvider() {
////        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
////        provider.setUserDetailsService(userDetailsService);
////        provider.setPasswordEncoder(passwordEncoder);
////        return provider;
////    }
////
////    @Bean
////    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
////            throws Exception {
////        return config.getAuthenticationManager();
////    }
////}
//
//
//package com.priyanshu.hospitalmanagement.security;
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.context.annotation.Bean;
//import org.springframework.context.annotation.Configuration;
//import org.springframework.http.HttpMethod;
//import org.springframework.security.authentication.AuthenticationManager;
//import org.springframework.security.authentication.AuthenticationProvider;
//import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
//import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
//import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
//import org.springframework.security.config.annotation.web.builders.HttpSecurity;
//import org.springframework.security.config.http.SessionCreationPolicy;
//import org.springframework.security.core.userdetails.UserDetailsService;
//import org.springframework.security.crypto.password.PasswordEncoder;
//import org.springframework.security.web.SecurityFilterChain;
//import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
//
//import static com.priyanshu.hospitalmanagement.entity.type.PermissionType.*;
//import static com.priyanshu.hospitalmanagement.entity.type.RoleType.*;
//
//@Configuration
//@RequiredArgsConstructor
//@EnableMethodSecurity
//public class WebSecurityConfig {
//
//    private final UserDetailsService userDetailsService;
//    private final JwtAuthFilter jwtAuthFilter;
//    private final PasswordEncoder passwordEncoder;
//
//    @Bean
//    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//
//        return http
//                .csrf(csrf -> csrf.disable())
//
//                .formLogin(form -> form.disable())
//
//                .authorizeHttpRequests(auth -> auth
//
//                        // ── Public endpoints ──────────────────────────────────────────
//                        .requestMatchers(
//                                "/public/**",
//                                "/auth/**",
//                                "/swagger-ui/**",
//                                "/v3/api-docs/**"
//                        ).permitAll()
//
//                        // ── Admin ─────────────────────────────────────────────────────
//                        .requestMatchers(HttpMethod.DELETE, "/admin/**")
//                        .hasAnyAuthority(
//                                APPOINTMENT_DELETE.getPermission(),
//                                USER_MANAGE.getPermission()
//                        )
//
//                        .requestMatchers("/admin/**")
//                        .hasRole(ADMIN.name())
//
//                        // ── Doctors ───────────────────────────────────────────────────
//                        .requestMatchers("/doctors/**")
//                        .hasAnyRole(DOCTOR.name(), ADMIN.name())
//
//                        // ── Patients ──────────────────────────────────────────────────
//                        .requestMatchers("/patient/**")
//                        .hasRole(PATIENT.name())
//
//                        // ── Prescriptions ─────────────────────────────────────────────
//                        // FIX: removed duplicate POST rule (was listed twice before)
//                        .requestMatchers(HttpMethod.POST, "/prescriptions/**")
//                        .hasRole(DOCTOR.name())
//
//                        .requestMatchers(HttpMethod.GET, "/prescriptions/*/download")
//                        .hasAnyRole(PATIENT.name(), DOCTOR.name())
//
//                        // ── Bills ─────────────────────────────────────────────────────
//                        // FIX: aligned to match BillController paths (/bills/patient/**, etc.)
//                        .requestMatchers(HttpMethod.GET,"/bills/patient", "/bills/patient/**")
//                        .hasRole(PATIENT.name())
//
//                        .requestMatchers(HttpMethod.GET, "/bills/*/download")
//                        .hasRole(PATIENT.name())
//
//                        .requestMatchers(HttpMethod.PATCH, "/bills/*/mark-paid")
//                        .hasRole(ADMIN.name())
//
//                        // ── Medical Records ───────────────────────────────────────────
//                        // FIX: these were completely missing before — any request could hit them
//                        .requestMatchers(HttpMethod.POST, "/medical-records/**")
//                        .hasAnyRole(DOCTOR.name(), ADMIN.name())
//
//                        .requestMatchers(HttpMethod.GET, "/medical-records/patient/**")
//                        .hasAnyRole(DOCTOR.name(), ADMIN.name(), PATIENT.name())
//
//                        // ── Fallback ──────────────────────────────────────────────────
//                        .anyRequest().authenticated()
//                )
//
//                .sessionManagement(session ->
//                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
//                )
//
//                .authenticationProvider(authenticationProvider())
//
//                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
//
//                .build();
//    }
//
//    @Bean
//    public AuthenticationProvider authenticationProvider() {
//
//        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
//
//        provider.setUserDetailsService(userDetailsService);
//        provider.setPasswordEncoder(passwordEncoder);
//
//        return provider;
//    }
//
//    @Bean
//    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
//            throws Exception {
//
//        return config.getAuthenticationManager();
//    }
//}
package com.priyanshu.hospitalmanagement.security;

import com.priyanshu.hospitalmanagement.config.CorsConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.web.HttpSessionOAuth2AuthorizationRequestRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

import static com.priyanshu.hospitalmanagement.entity.type.PermissionType.*;
import static com.priyanshu.hospitalmanagement.entity.type.RoleType.*;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class WebSecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;
    private final PasswordEncoder passwordEncoder;
    private final CorsConfigurationSource corsConfigurationSource; // ← ADD
    private final OAuth2SuccessHandler  oAuth2SuccessHandler;
    private final HttpCookieOAuth2AuthorizationRequestRepository cookieRepo;
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource)) // ← ADD
                .csrf(csrf -> csrf.disable())
                .formLogin(form -> form.disable())

                .authorizeHttpRequests(auth -> auth

                        .requestMatchers(
                                "/public/**",
                                "/auth/**",
                                "/login",            // ✅ ADD
                                "/login/**",
                                "/login/oauth2/**",        // ✅ OAuth2 callback
                                "/oauth2/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        .requestMatchers(HttpMethod.DELETE, "/admin/**")
                        .hasAnyAuthority(
                                APPOINTMENT_DELETE.getPermission(),
                                USER_MANAGE.getPermission()
                        )

                        .requestMatchers("/admin/**")
                        .hasRole(ADMIN.name())

                        .requestMatchers("/doctors/**")
                        .hasAnyRole(DOCTOR.name(), ADMIN.name())

                        .requestMatchers("/patient/**")
                        .hasRole(PATIENT.name())

                        .requestMatchers(HttpMethod.POST, "/prescriptions/**")
                        .hasRole(DOCTOR.name())

                        .requestMatchers(HttpMethod.GET, "/prescriptions/*/download")
                        .hasAnyRole(PATIENT.name(), DOCTOR.name())

                        .requestMatchers(HttpMethod.GET, "/bills/patient", "/bills/patient/**")
                        .hasRole(PATIENT.name())

                        .requestMatchers(HttpMethod.GET, "/bills/*/download")
                        .hasAnyRole(PATIENT.name(),ADMIN.name())

                        .requestMatchers(HttpMethod.PATCH, "/bills/*/mark-paid")
                        .hasRole(ADMIN.name())

                        .requestMatchers(HttpMethod.POST, "/medical-records/**")
                        .hasAnyRole(DOCTOR.name(), ADMIN.name())

                        .requestMatchers(HttpMethod.GET, "/medical-records/patient/**")
                        .hasAnyRole(DOCTOR.name(), ADMIN.name(), PATIENT.name())

                        .anyRequest().authenticated()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                )     .oauth2Login(oauth2 -> oauth2
                                .authorizationEndpoint(auth -> auth
                                        .authorizationRequestRepository(cookieRepo)
                                )

                                .successHandler(oAuth2SuccessHandler)
                                .failureHandler((request, response, exception) -> {
                                      response.sendRedirect("http://localhost:5173/?error=" +
                                            exception.getMessage());
                                })
                        // No custom login page — redirect from frontend directly
                )

                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}