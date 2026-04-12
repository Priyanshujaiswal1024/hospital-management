package com.priyanshu.hospitalmanagement.kafka.consumer;


import com.priyanshu.hospitalmanagement.config.KafkaTopicConfig;
import com.priyanshu.hospitalmanagement.kafka.event.AppointmentEmailEvent;
import com.priyanshu.hospitalmanagement.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AppointmentEmailConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = KafkaTopicConfig.APPOINTMENT_EMAIL_TOPIC,
            groupId = "hospital-email-group",
            containerFactory = "appointmentKafkaListenerContainerFactory"
    )
    public void consume(AppointmentEmailEvent event) {
        log.info("Consuming appointment event: kind={} to={}", event.getKind(), event.getToEmail());
        try {
            switch (event.getKind()) {
                case BOOKED -> emailService.sendAppointmentBooked(
                        event.getToEmail(), event.getPatientName(),
                        event.getDoctorName(), event.getAppointmentTime(), event.getReason());

                case CANCELLED -> emailService.sendAppointmentCancelled(
                        event.getToEmail(), event.getPatientName(), event.getAppointmentTime());

                case DOCTOR_NEW -> emailService.sendDoctorNewAppointment(
                        event.getToEmail(), event.getDoctorName(), event.getPatientName(),
                        event.getAppointmentTime(), event.getReason(), event.getAppointmentId());

                case DOCTOR_REASSIGNED -> emailService.sendDoctorReassigned(
                        event.getToEmail(), event.getDoctorName(), event.getPatientName(),
                        event.getAppointmentTime(), event.getReason(),
                        event.getPreviousDoctorName(), event.getAppointmentId());
            }
        } catch (Exception e) {
            log.error("Failed to process appointment email event kind={}: {}", event.getKind(), e.getMessage(), e);
        }
    }
}