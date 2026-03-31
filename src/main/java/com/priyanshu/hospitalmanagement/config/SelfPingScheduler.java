package com.priyanshu.hospitalmanagement.config;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

@Component
public class SelfPingScheduler {

    @Scheduled(fixedRate = 840000)
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
    }
}