package com.priyanshu.hospitalmanagement.config;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
@RequiredArgsConstructor
public class SelfPingScheduler {

    private final JdbcTemplate jdbcTemplate;
    @Scheduled(fixedRate = 600000)
    public void ping() {
        try {
            new RestTemplate().getForObject(
                    "https://hospital-management-0rx3.onrender.com/api/v1/actuator/health",
                    String.class
            );
            System.out.println("✅ Self-ping successful");
        } catch (Exception e) {
            System.out.println("❌ Ping failed: " + e.getMessage());
        }
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            System.out.println("✅ Neon DB ping successful");
        } catch (Exception e) {
            System.out.println("❌ Neon DB ping failed: " + e.getMessage());
        }
    }
}