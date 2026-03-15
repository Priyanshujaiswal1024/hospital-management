package com.priyanshu.hospitalmanagement.security;

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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import static com.priyanshu.hospitalmanagement.entity.type.PermissionType.*;
import static com.priyanshu.hospitalmanagement.entity.type.RoleType.*;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity
public class WebSecurityConfig {

    private final UserDetailsService userDetailsService;
    private final JwtAuthFilter jwtAuthFilter;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        return http
                .csrf(csrf -> csrf.disable())

                .formLogin(form -> form.disable())

                .authorizeHttpRequests(auth -> auth

                        // ── Public endpoints ──────────────────────────────────────────
                        .requestMatchers(
                                "/public/**",
                                "/auth/**",
                                "/swagger-ui/**",
                                "/v3/api-docs/**"
                        ).permitAll()

                        // ── Admin ─────────────────────────────────────────────────────
                        .requestMatchers(HttpMethod.DELETE, "/admin/**")
                        .hasAnyAuthority(
                                APPOINTMENT_DELETE.getPermission(),
                                USER_MANAGE.getPermission()
                        )

                        .requestMatchers("/admin/**")
                        .hasRole(ADMIN.name())

                        // ── Doctors ───────────────────────────────────────────────────
                        .requestMatchers("/doctors/**")
                        .hasAnyRole(DOCTOR.name(), ADMIN.name())

                        // ── Patients ──────────────────────────────────────────────────
                        .requestMatchers("/patient/**")
                        .hasRole(PATIENT.name())

                        // ── Prescriptions ─────────────────────────────────────────────
                        // FIX: removed duplicate POST rule (was listed twice before)
                        .requestMatchers(HttpMethod.POST, "/prescriptions/**")
                        .hasRole(DOCTOR.name())

                        .requestMatchers(HttpMethod.GET, "/prescriptions/*/download")
                        .hasAnyRole(PATIENT.name(), DOCTOR.name())

                        // ── Bills ─────────────────────────────────────────────────────
                        // FIX: aligned to match BillController paths (/bills/patient/**, etc.)
                        .requestMatchers(HttpMethod.GET,"/bills/patient", "/bills/patient/**")
                        .hasRole(PATIENT.name())

                        .requestMatchers(HttpMethod.GET, "/bills/*/download")
                        .hasRole(PATIENT.name())

                        .requestMatchers(HttpMethod.PATCH, "/bills/*/mark-paid")
                        .hasRole(ADMIN.name())

                        // ── Medical Records ───────────────────────────────────────────
                        // FIX: these were completely missing before — any request could hit them
                        .requestMatchers(HttpMethod.POST, "/medical-records/**")
                        .hasAnyRole(DOCTOR.name(), ADMIN.name())

                        .requestMatchers(HttpMethod.GET, "/medical-records/patient/**")
                        .hasAnyRole(DOCTOR.name(), ADMIN.name(), PATIENT.name())

                        // ── Fallback ──────────────────────────────────────────────────
                        .anyRequest().authenticated()
                )

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
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
//import org.springframework.web.cors.CorsConfigurationSource;
//
//import static com.priyanshu.hospitalmanagement.entity.type.PermissionType.*;
//
//@Configuration
//@RequiredArgsConstructor
//@EnableMethodSecurity
//public class WebSecurityConfig {
//
//    private final UserDetailsService userDetailsService;
//    private final JwtAuthFilter jwtAuthFilter;
//    private final PasswordEncoder passwordEncoder;
//    private final CorsConfigurationSource corsConfigurationSource; // ← NEW
//
//    @Bean
//    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
//
//        return http
//                .cors(cors -> cors.configurationSource(corsConfigurationSource)) // ← NEW
//
//                .csrf(csrf -> csrf.disable())
//                .formLogin(form -> form.disable())
//
//                .authorizeHttpRequests(auth -> auth
//
//                        .requestMatchers(
//                                "/public/**",
//                                "/auth/**",
//                                "/swagger-ui/**",
//                                "/v3/api-docs/**"
//                        ).permitAll()
//
//                        // CHANGED: hasRole() → hasAuthority() because DB has no ROLE_ prefix
//                        .requestMatchers(HttpMethod.DELETE, "/admin/**")
//                        .hasAnyAuthority(
//                                APPOINTMENT_DELETE.getPermission(),
//                                USER_MANAGE.getPermission()
//                        )
//
//                        .requestMatchers("/admin/**")
//                        .hasAuthority("ADMIN")                         // ← CHANGED
//
//                        .requestMatchers("/doctors/**")
//                        .hasAnyAuthority("DOCTOR", "ADMIN")            // ← CHANGED
//
//                        .requestMatchers("/patient/**")
//                        .hasAuthority("PATIENT")                       // ← CHANGED
//
//                        .requestMatchers(HttpMethod.POST, "/prescriptions/**")
//                        .hasAuthority("DOCTOR")                        // ← CHANGED
//
//                        .requestMatchers(HttpMethod.GET, "/prescriptions/*/download")
//                        .hasAnyAuthority("PATIENT", "DOCTOR")          // ← CHANGED
//
//                        .requestMatchers(HttpMethod.GET, "/bills/patient", "/bills/patient/**")
//                        .hasAuthority("PATIENT")                       // ← CHANGED
//
//                        .requestMatchers(HttpMethod.GET, "/bills/*/download")
//                        .hasAuthority("PATIENT")                       // ← CHANGED
//
//                        .requestMatchers(HttpMethod.PATCH, "/bills/*/mark-paid")
//                        .hasAuthority("ADMIN")                         // ← CHANGED
//
//                        .requestMatchers(HttpMethod.POST, "/medical-records/**")
//                        .hasAnyAuthority("DOCTOR", "ADMIN")            // ← CHANGED
//
//                        .requestMatchers(HttpMethod.GET, "/medical-records/patient/**")
//                        .hasAnyAuthority("DOCTOR", "ADMIN", "PATIENT") // ← CHANGED
//
//                        .anyRequest().authenticated()
//                )
//
//                .sessionManagement(session ->
//                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
//                )
//
//                .authenticationProvider(authenticationProvider())
//                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
//                .build();
//    }
//
//    @Bean
//    public AuthenticationProvider authenticationProvider() {
//        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
//        provider.setUserDetailsService(userDetailsService);
//        provider.setPasswordEncoder(passwordEncoder);
//        return provider;
//    }
//
//    @Bean
//    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
//            throws Exception {
//        return config.getAuthenticationManager();
//    }
//}