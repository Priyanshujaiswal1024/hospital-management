package com.priyanshu.hospitalmanagement.security;

import com.priyanshu.hospitalmanagement.service.TokenBlacklist;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JWTService authUtil;
    private final ApplicationContext context;
    private final TokenBlacklist tokenBlacklist;
    private final UserDetailsService userDetailsService;
    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        String token = null;
        String username = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {

            token = authHeader.substring(7);
            try{
            // ── BLACKLIST CHECK ───────────────────────────────────────────
            // If token was logged out, reject immediately
            if (tokenBlacklist.isBlacklisted(token)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write(
                        "{\"error\": \"Token has been invalidated. Please log in again.\"}"
                );
                return; // ← stop filter chain, don't authenticate
            }
            // ─────────────────────────────────────────────────────────────
            username = authUtil.getUsernameFromToken(token);
        } catch (Exception e) {
                filterChain.doFilter(request, response);
                return;
            }
        }

        if (username != null &&
                SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = context
                    .getBean(MyUserDetailsService.class)
                    .loadUserByUsername(username);

            if (authUtil.validateToken(token, userDetails)) {

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );

                authentication.setDetails(
                        new WebAuthenticationDetailsSource()
                                .buildDetails(request)
                );

                SecurityContextHolder.getContext()
                        .setAuthentication(authentication);
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/auth/login")
                || path.equals("/auth/register")
                || path.equals("/auth/signup")
                || path.equals("/auth/verify-otp")
                || path.equals("/auth/resend-otp")
                || path.startsWith("/public")
                || path.startsWith("/oauth2")           // ✅ ADD
                || path.startsWith("/login/oauth2")     // ✅ ADD
                || path.startsWith("/login");            // ✅ ADD
    }
}