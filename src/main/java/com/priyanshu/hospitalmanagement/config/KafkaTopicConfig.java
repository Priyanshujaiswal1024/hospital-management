package com.priyanshu.hospitalmanagement.config;
import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

@Configuration
public class KafkaTopicConfig {

    public static final String APPOINTMENT_EMAIL_TOPIC = "appointment-email";
    public static final String BILLING_EMAIL_TOPIC     = "billing-email";
    public static final String USER_EMAIL_TOPIC        = "user-email";

    @Bean
    public NewTopic appointmentEmailTopic() {
        return TopicBuilder.name(APPOINTMENT_EMAIL_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic billingEmailTopic() {
        return TopicBuilder.name(BILLING_EMAIL_TOPIC).partitions(3).replicas(1).build();
    }

    @Bean
    public NewTopic userEmailTopic() {
        return TopicBuilder.name(USER_EMAIL_TOPIC).partitions(3).replicas(1).build();
    }
}