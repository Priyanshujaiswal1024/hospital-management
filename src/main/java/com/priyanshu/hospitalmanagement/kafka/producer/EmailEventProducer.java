package com.priyanshu.hospitalmanagement.kafka.producer;


import com.priyanshu.hospitalmanagement.config.KafkaTopicConfig;
import com.priyanshu.hospitalmanagement.kafka.event.AppointmentEmailEvent;
import com.priyanshu.hospitalmanagement.kafka.event.BillingEmailEvent;
import com.priyanshu.hospitalmanagement.kafka.event.UserEmailEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailEventProducer {

    private final KafkaTemplate<String, AppointmentEmailEvent> appointmentKafkaTemplate;
    private final KafkaTemplate<String, BillingEmailEvent>     billingKafkaTemplate;
    private final KafkaTemplate<String, UserEmailEvent>        userKafkaTemplate;

    public void sendAppointmentEvent(AppointmentEmailEvent event) {
        appointmentKafkaTemplate.send(KafkaTopicConfig.APPOINTMENT_EMAIL_TOPIC, event.getToEmail(), event)
                .whenComplete((r, ex) -> {
                    if (ex != null) log.error("Failed to publish appointment event to {}: {}", event.getToEmail(), ex.getMessage());
                    else log.debug("Appointment event published: kind={} to={}", event.getKind(), event.getToEmail());
                });
    }

    public void sendBillingEvent(BillingEmailEvent event) {
        billingKafkaTemplate.send(KafkaTopicConfig.BILLING_EMAIL_TOPIC, event.getToEmail(), event)
                .whenComplete((r, ex) -> {
                    if (ex != null) log.error("Failed to publish billing event to {}: {}", event.getToEmail(), ex.getMessage());
                    else log.debug("Billing event published: kind={} to={}", event.getKind(), event.getToEmail());
                });
    }

    public void sendUserEvent(UserEmailEvent event) {
        userKafkaTemplate.send(KafkaTopicConfig.USER_EMAIL_TOPIC, event.getToEmail(), event)
                .whenComplete((r, ex) -> {
                    if (ex != null) log.error("Failed to publish user event to {}: {}", event.getToEmail(), ex.getMessage());
                    else log.debug("User event published: kind={} to={}", event.getKind(), event.getToEmail());
                });
    }
}