package com.priyanshu.hospitalmanagement.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OtpService {

    private static final Duration     OTP_TTL = Duration.ofMinutes(5);
    private static final String       PREFIX  = "otp:";
    private static final SecureRandom RANDOM  = new SecureRandom();

    // ✅ Atomic GET + DELETE via Lua — prevents double-use race condition
    private static final DefaultRedisScript<Long> VERIFY_AND_DELETE_SCRIPT =
            new DefaultRedisScript<>("""
                local stored = redis.call('GET', KEYS[1])
                if stored == ARGV[1] then
                    redis.call('DEL', KEYS[1])
                    return 1
                end
                return 0
                """, Long.class);

    private final StringRedisTemplate redisTemplate;

    public String generateAndSaveOtp(String key) {
        String otp = String.format("%06d", RANDOM.nextInt(1_000_000));
        try {
            redisTemplate.opsForValue().set(PREFIX + key, otp, OTP_TTL);
        } catch (Exception e) {
            log.error("Redis write failed for OTP [{}]: {}", key, e.getMessage());
            throw new RuntimeException("OTP service temporarily unavailable. Please try again.");
        }
        return otp;
    }

    public boolean verifyAndDelete(String key, String otp) {
        if (otp == null) return false;
        try {
            Long result = redisTemplate.execute(
                    VERIFY_AND_DELETE_SCRIPT,
                    List.of(PREFIX + key),
                    otp
            );
            return Long.valueOf(1L).equals(result);
        } catch (Exception e) {
            log.error("Redis verify failed for OTP [{}]: {}", key, e.getMessage());
            throw new RuntimeException("OTP verification temporarily unavailable. Please try again.");
        }
    }

    public void deleteOtp(String key) {
        try {
            redisTemplate.delete(PREFIX + key);
        } catch (Exception e) {
            log.warn("Redis delete failed for OTP [{}]: {}", key, e.getMessage());
        }
    }
}