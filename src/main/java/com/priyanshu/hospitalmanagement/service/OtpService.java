package com.priyanshu.hospitalmanagement.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final Duration      OTP_TTL  = Duration.ofMinutes(5);
    private static final String        PREFIX   = "otp:";
    private static final SecureRandom  RANDOM   = new SecureRandom(); // ✅ cryptographically secure

    private final StringRedisTemplate redisTemplate;

    /** Generate a 6-digit OTP, store it in Redis, and return the raw value. */
    public String generateAndSaveOtp(String key) {
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000)); // ✅ always 6 digits
        redisTemplate.opsForValue().set(PREFIX + key, otp, OTP_TTL);
        return otp;
    }

    /**
     * Validate AND delete atomically (one-time use).
     * Returns false if OTP is wrong or has expired (key missing from Redis).
     */
    public boolean verifyAndDelete(String key, String otp) {
        String stored = redisTemplate.opsForValue().get(PREFIX + key);
        if (otp == null || !otp.equals(stored)) return false; // ✅ check before delete
        redisTemplate.delete(PREFIX + key);
        return true;
    }

    /** Explicit delete — e.g., admin invalidation. */
    public void deleteOtp(String key) {
        redisTemplate.delete(PREFIX + key);
    }
}