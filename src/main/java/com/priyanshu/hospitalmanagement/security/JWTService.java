//package com.priyanshu.hospitalmanagement.security;
//
//import com.priyanshu.hospitalmanagement.entity.User;
//import io.jsonwebtoken.Claims;
//import io.jsonwebtoken.Jwts;
//import io.jsonwebtoken.security.Keys;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.security.core.userdetails.UserDetails;
//import org.springframework.stereotype.Component;
//
//import javax.crypto.SecretKey;
//import java.util.Date;
//import java.util.HashMap;
//import java.util.Map;
//import java.util.function.Function;
//
//@Component
//public class JWTService {
//
//    @Value("${jwt.secretKey}")
//    private String secretKey;
//
//    // Generate Secret Key
//    private SecretKey getKey() {
//        return Keys.hmacShaKeyFor(secretKey.getBytes());
//    }
//
//    // Generate Token
//    public String generateToken(User user) {
//
//        Map<String, Object> claims = new HashMap<>();
//        claims.put("roles", user.getRoles());
//        claims.put("userId", user.getId());
//
//        return Jwts.builder()
//                .claims()
//                .add(claims)
//                .subject(user.getUsername())
//                .issuedAt(new Date(System.currentTimeMillis()))
//                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60)) // 1 hour
//                .and()
//                .signWith(getKey())
//                .compact();
//    }
//
//    // Extract Username
//    public String getUsernameFromToken(String token) {
//        return extractClaim(token, Claims::getSubject);
//    }
//
//    // Extract Expiration
//    public Date getExpiration(String token) {
//        return extractClaim(token, Claims::getExpiration);
//    }
//
//    // Generic Claim Extractor
//    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
//
//        Claims claims = extractAllClaims(token);
//
//        return resolver.apply(claims);
//    }
//
//    // Extract All Claims
//    private Claims extractAllClaims(String token) {
//
//        return Jwts.parser()
//                .verifyWith(getKey())
//                .build()
//                .parseSignedClaims(token)
//                .getPayload();
//    }
//
//    // Check Token Expired
//    private boolean isTokenExpired(String token) {
//
//        return getExpiration(token).before(new Date());
//    }
//
//    // Validate Token
//    public boolean validateToken(String token, UserDetails userDetails) {
//
//        String username = getUsernameFromToken(token);
//
//        return username.equals(userDetails.getUsername())
//                && !isTokenExpired(token);
//    }
//}
package com.priyanshu.hospitalmanagement.security;

import com.priyanshu.hospitalmanagement.entity.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JWTService {

    @Value("${jwt.secretKey}")
    private String secretKey;

    private SecretKey getKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public String generateToken(User user) {

        Map<String, Object> claims = new HashMap<>();

        // Set<RoleType> se pehla role string mein nikalo
        String role = user.getRoles()
                .stream()
                .findFirst()
                .map(Enum::name)
                .orElse("PATIENT");

        claims.put("role",   role);          // "PATIENT" / "DOCTOR" / "ADMIN"
        claims.put("userId", user.getId());  // user id

        return Jwts.builder()
                .claims()
                .add(claims)
                .subject(user.getUsername()) // email
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60 * 24)) // 24 hrs
                .and()
                .signWith(getKey())
                .compact();
    }

    public String getUsernameFromToken(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public Date getExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extractAllClaims(token);
        return resolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private boolean isTokenExpired(String token) {
        return getExpiration(token).before(new Date());
    }

    public boolean validateToken(String token, UserDetails userDetails) {
        String username = getUsernameFromToken(token);
        return username.equals(userDetails.getUsername())
                && !isTokenExpired(token);
    }
}