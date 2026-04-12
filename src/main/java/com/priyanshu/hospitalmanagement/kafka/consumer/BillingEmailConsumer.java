package com.priyanshu.hospitalmanagement.kafka.consumer;

//import com.priyanshu.hospitalmanagement.kafka.config.KafkaTopicConfig;
import com.priyanshu.hospitalmanagement.config.KafkaTopicConfig;
import com.priyanshu.hospitalmanagement.kafka.event.BillingEmailEvent;
import com.priyanshu.hospitalmanagement.kafka.event.MedicineEventDto;
import com.priyanshu.hospitalmanagement.entity.PrescriptionMedicine;
import com.priyanshu.hospitalmanagement.entity.Medicine;
import com.priyanshu.hospitalmanagement.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class BillingEmailConsumer {

    private final EmailService emailService;

    @KafkaListener(
            topics = KafkaTopicConfig.BILLING_EMAIL_TOPIC,
            groupId = "hospital-email-group",
            containerFactory = "billingKafkaListenerContainerFactory"
    )
    public void consume(BillingEmailEvent event) {
        log.info("Consuming billing event: kind={} to={}", event.getKind(), event.getToEmail());
        try {
            switch (event.getKind()) {
                case BILL_GENERATED -> emailService.sendBillGenerated(
                        event.getToEmail(), event.getPatientName(),
                        event.getConsultationFee(), event.getGstAmount(),
                        event.getTotalAmount(), event.getBillId());

                case PAYMENT_CONFIRMED -> emailService.sendPaymentConfirmation(
                        event.getToEmail(), event.getPatientName(),
                        event.getTotalAmount(), event.getBillId(), event.getPaidAt());

                case PRESCRIPTION_ADDED -> emailService.sendPrescriptionAdded(
                        event.getToEmail(), event.getPatientName(),
                        event.getDoctorName(), null,
                        toEntityList(event.getMedicines()));

                case MEDICAL_RECORD_CREATED -> emailService.sendMedicalRecordCreated(
                        event.getToEmail(), event.getPatientName(), event.getDoctorName(),
                        event.getDiagnosis(), event.getNotes(),
                        event.getVisitDate(), event.getRecordId());
            }
        } catch (Exception e) {
            log.error("Failed to process billing email event kind={}: {}", event.getKind(), e.getMessage(), e);
        }
    }

    // Convert lightweight MedicineEventDto → PrescriptionMedicine shell
    // (EmailService only reads .getMedicine().getName(), frequency, durationDays, etc.)
    private List<PrescriptionMedicine> toEntityList(List<MedicineEventDto> dtos) {
        if (dtos == null) return List.of();
        return dtos.stream().map(dto -> {
            Medicine med = new Medicine();
            med.setName(dto.getMedicineName());

            PrescriptionMedicine pm = new PrescriptionMedicine();
            pm.setMedicine(med);
            pm.setFrequency(dto.getFrequency());
            pm.setDurationDays(dto.getDurationDays());
            pm.setQuantity(dto.getQuantity());
            pm.setInstructions(dto.getInstructions());
            return pm;
        }).toList();
    }
}