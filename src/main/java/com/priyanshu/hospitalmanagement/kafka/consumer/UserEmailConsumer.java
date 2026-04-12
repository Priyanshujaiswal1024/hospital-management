package com.priyanshu.hospitalmanagement.kafka.consumer;

//import com.priyanshu.hospitalmanagement.kafka.config.KafkaTopicConfig;
import com.priyanshu.hospitalmanagement.config.KafkaTopicConfig;
import com.priyanshu.hospitalmanagement.kafka.event.UserEmailEvent;
import com.priyanshu.hospitalmanagement.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class UserEmailConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = KafkaTopicConfig.USER_EMAIL_TOPIC,
            groupId = "hospital-email-group",
            containerFactory = "userKafkaListenerContainerFactory"
    )
    public void consume(UserEmailEvent event) {
        log.info("Consuming user event: kind={} to={}", event.getKind(), event.getToEmail());
        try {
            switch (event.getKind()) {
                case OTP             -> emailService.sendOtp(event.getToEmail(), event.getOtp());
                case PATIENT_WELCOME -> emailService.sendPatientWelcome(event.getToEmail(), event.getName());
                case DOCTOR_WELCOME  -> emailService.sendDoctorWelcome(event.getToEmail(), event.getName(), event.getTempPassword());
            }
        } catch (Exception e) {
            log.error("Failed to process user email event kind={}: {}", event.getKind(), e.getMessage(), e);
        }
    }
}