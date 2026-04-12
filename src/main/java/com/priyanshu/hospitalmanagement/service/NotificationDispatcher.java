package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.entity.PrescriptionMedicine;
import com.priyanshu.hospitalmanagement.kafka.event.AppointmentEmailEvent;
import com.priyanshu.hospitalmanagement.kafka.event.BillingEmailEvent;
import com.priyanshu.hospitalmanagement.kafka.event.MedicineEventDto;
import com.priyanshu.hospitalmanagement.kafka.event.UserEmailEvent;
import com.priyanshu.hospitalmanagement.kafka.producer.EmailEventProducer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

/**
 * ╔══════════════════════════════════════════════════════════════════════╗
 * ║               N O T I F I C A T I O N   D I S P A T C H E R        ║
 * ╠══════════════════════════════════════════════════════════════════════╣
 * ║  Single entry-point for ALL email notifications in the system.       ║
 * ║                                                                      ║
 * ║  Routing logic (controlled by kafka.enabled in application.yml):     ║
 * ║                                                                      ║
 * ║  kafka.enabled=true  → EmailEventProducer → Kafka → Consumer → Email ║
 * ║  kafka.enabled=false → EmailService (direct, synchronous call)       ║
 * ║                                                                      ║
 * ║  Every send is wrapped in try-catch.                                 ║
 * ║  Email failures are LOGGED but NEVER propagate to the caller.        ║
 * ║  Business operations (save appointment, generate bill, etc.)         ║
 * ║  always succeed regardless of email/Kafka status.                    ║
 * ╚══════════════════════════════════════════════════════════════════════╝
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDispatcher {

    // ── Dependencies ──────────────────────────────────────────────────────────
    private final EmailService emailService;
    private final EmailEventProducer producer;

    /**
     * Feature toggle — set in application.yml or environment variable.
     * Defaults to true (Kafka ON) if the property is not present.
     *
     * On Render free tier: set kafka.enabled=false in your environment variables.
     */
    @Value("${kafka.enabled:true}")
    private boolean kafkaEnabled;

    // =========================================================================
    //  APPOINTMENT NOTIFICATIONS
    // =========================================================================

    /**
     * Notifies the PATIENT that their appointment has been booked.
     */
    public void sendAppointmentBooked(String toEmail, String patientName,
                                      String doctorName, LocalDateTime appointmentTime,
                                      String reason) {
        if (kafkaEnabled) {
            dispatchAppointmentEvent(AppointmentEmailEvent.builder()
                    .kind(AppointmentEmailEvent.Kind.BOOKED)
                    .toEmail(toEmail)
                    .patientName(patientName)
                    .doctorName(doctorName)
                    .appointmentTime(appointmentTime)
                    .reason(reason)
                    .build());
        } else {
            safeDirectEmail("appointment-booked [patient]", toEmail, () ->
                    emailService.sendAppointmentBooked(toEmail, patientName, doctorName,
                            appointmentTime, reason));
        }
    }

    /**
     * Notifies the DOCTOR that a new appointment has been assigned to them.
     */
    public void sendDoctorNewAppointment(String toEmail, String doctorName,
                                         String patientName, LocalDateTime appointmentTime,
                                         String reason, Long appointmentId) {
        if (kafkaEnabled) {
            dispatchAppointmentEvent(AppointmentEmailEvent.builder()
                    .kind(AppointmentEmailEvent.Kind.DOCTOR_NEW)
                    .toEmail(toEmail)
                    .doctorName(doctorName)
                    .patientName(patientName)
                    .appointmentTime(appointmentTime)
                    .reason(reason)
                    .appointmentId(appointmentId)
                    .build());
        } else {
            safeDirectEmail("appointment-booked [doctor]", toEmail, () ->
                    emailService.sendDoctorNewAppointment(toEmail, doctorName, patientName,
                            appointmentTime, reason, appointmentId));
        }
    }

    /**
     * Notifies the PATIENT that their appointment has been cancelled.
     */
    public void sendAppointmentCancelled(String toEmail, String patientName,
                                         LocalDateTime appointmentTime) {
        if (kafkaEnabled) {
            dispatchAppointmentEvent(AppointmentEmailEvent.builder()
                    .kind(AppointmentEmailEvent.Kind.CANCELLED)
                    .toEmail(toEmail)
                    .patientName(patientName)
                    .appointmentTime(appointmentTime)
                    .build());
        } else {
            safeDirectEmail("appointment-cancelled", toEmail, () ->
                    emailService.sendAppointmentCancelled(toEmail, patientName, appointmentTime));
        }
    }

    /**
     * Notifies the NEW DOCTOR that an appointment has been reassigned to them.
     */
    public void sendDoctorReassigned(String toEmail, String doctorName,
                                     String patientName, LocalDateTime appointmentTime,
                                     String reason, String previousDoctorName,
                                     Long appointmentId) {
        if (kafkaEnabled) {
            dispatchAppointmentEvent(AppointmentEmailEvent.builder()
                    .kind(AppointmentEmailEvent.Kind.DOCTOR_REASSIGNED)
                    .toEmail(toEmail)
                    .doctorName(doctorName)
                    .patientName(patientName)
                    .appointmentTime(appointmentTime)
                    .reason(reason)
                    .previousDoctorName(previousDoctorName)
                    .appointmentId(appointmentId)
                    .build());
        } else {
            safeDirectEmail("doctor-reassigned", toEmail, () ->
                    emailService.sendDoctorReassigned(toEmail, doctorName, patientName,
                            appointmentTime, reason, previousDoctorName, appointmentId));
        }
    }

    // =========================================================================
    //  BILLING NOTIFICATIONS
    // =========================================================================

    /**
     * Notifies the PATIENT that a bill has been generated for their visit.
     */
    public void sendBillGenerated(String toEmail, String patientName,
                                  double consultationFee, double gstAmount,
                                  double totalAmount, Long billId) {
        if (kafkaEnabled) {
            dispatchBillingEvent(BillingEmailEvent.builder()
                    .kind(BillingEmailEvent.Kind.BILL_GENERATED)
                    .toEmail(toEmail)
                    .patientName(patientName)
                    .consultationFee(consultationFee)
                    .gstAmount(gstAmount)
                    .totalAmount(totalAmount)
                    .billId(billId)
                    .build());
        } else {
            safeDirectEmail("bill-generated", toEmail, () ->
                    emailService.sendBillGenerated(toEmail, patientName, consultationFee,
                            gstAmount, totalAmount, billId));
        }
    }

    /**
     * Notifies the PATIENT that their payment has been received and confirmed.
     */
    public void sendPaymentConfirmed(String toEmail, String patientName,
                                     double totalAmount, Long billId,
                                     LocalDateTime paidAt) {
        if (kafkaEnabled) {
            dispatchBillingEvent(BillingEmailEvent.builder()
                    .kind(BillingEmailEvent.Kind.PAYMENT_CONFIRMED)
                    .toEmail(toEmail)
                    .patientName(patientName)
                    .totalAmount(totalAmount)
                    .billId(billId)
                    .paidAt(paidAt)
                    .build());
        } else {
            safeDirectEmail("payment-confirmed", toEmail, () ->
                    emailService.sendPaymentConfirmation(toEmail, patientName,
                            totalAmount, billId, paidAt));
        }
    }

    /**
     * Sends the PRESCRIPTION summary email to the patient.
     *
     * @param medicines  List of PrescriptionMedicine entities (used in direct mode)
     * @param eventMeds  List of MedicineEventDto (used in Kafka mode — Kafka-safe, serializable)
     */
    public void sendPrescriptionAdded(String toEmail, String patientName,
                                      String doctorName,
                                      List<PrescriptionMedicine> medicines,
                                      List<MedicineEventDto> eventMeds) {
        if (kafkaEnabled) {
            dispatchBillingEvent(BillingEmailEvent.builder()
                    .kind(BillingEmailEvent.Kind.PRESCRIPTION_ADDED)
                    .toEmail(toEmail)
                    .patientName(patientName)
                    .doctorName(doctorName)
                    .medicines(eventMeds)
                    .build());
        } else {
            safeDirectEmail("prescription-added", toEmail, () ->
                    emailService.sendPrescriptionAdded(toEmail, patientName,
                            doctorName, null, medicines));
        }
    }

    /**
     * Notifies the PATIENT that their medical record has been created.
     */
    public void sendMedicalRecordCreated(String toEmail, String patientName,
                                         String doctorName, String diagnosis,
                                         String notes, String visitDate, Long recordId) {
        if (kafkaEnabled) {
            dispatchBillingEvent(BillingEmailEvent.builder()
                    .kind(BillingEmailEvent.Kind.MEDICAL_RECORD_CREATED)
                    .toEmail(toEmail)
                    .patientName(patientName)
                    .doctorName(doctorName)
                    .diagnosis(diagnosis)
                    .notes(notes)
                    .visitDate(visitDate)
                    .recordId(recordId)
                    .build());
        } else {
            safeDirectEmail("medical-record-created", toEmail, () ->
                    emailService.sendMedicalRecordCreated(toEmail, patientName, doctorName,
                            diagnosis, notes, visitDate, recordId));
        }
    }

    // =========================================================================
    //  USER / AUTH NOTIFICATIONS
    // =========================================================================

    /**
     * Sends a one-time OTP to the user for email verification.
     */
    public void sendOtp(String toEmail, String otp) {
        if (kafkaEnabled) {
            dispatchUserEvent(UserEmailEvent.builder()
                    .kind(UserEmailEvent.Kind.OTP)
                    .toEmail(toEmail)
                    .otp(otp)
                    .build());
        } else {
            safeDirectEmail("otp", toEmail, () -> emailService.sendOtp(toEmail, otp));
        }
    }

    /**
     * Sends a welcome email to a newly registered PATIENT.
     */
    public void sendPatientWelcome(String toEmail, String patientName) {
        if (kafkaEnabled) {
            dispatchUserEvent(UserEmailEvent.builder()
                    .kind(UserEmailEvent.Kind.PATIENT_WELCOME)
                    .toEmail(toEmail)
                    .name(patientName)
                    .build());
        } else {
            safeDirectEmail("patient-welcome", toEmail, () ->
                    emailService.sendPatientWelcome(toEmail, patientName));
        }
    }

    /**
     * Sends a welcome email to a newly onboarded DOCTOR (with temp password).
     */
    public void sendDoctorWelcome(String toEmail, String doctorName, String tempPassword) {
        if (kafkaEnabled) {
            dispatchUserEvent(UserEmailEvent.builder()
                    .kind(UserEmailEvent.Kind.DOCTOR_WELCOME)
                    .toEmail(toEmail)
                    .name(doctorName)
                    .tempPassword(tempPassword)
                    .build());
        } else {
            safeDirectEmail("doctor-welcome", toEmail, () ->
                    emailService.sendDoctorWelcome(toEmail, doctorName, tempPassword));
        }
    }

    // =========================================================================
    //  PRIVATE — Kafka dispatch helpers (each wraps in try-catch)
    // =========================================================================

    private void dispatchAppointmentEvent(AppointmentEmailEvent event) {
        try {
            producer.sendAppointmentEvent(event);
            log.debug("[Kafka] Appointment event dispatched: kind={} to={}", event.getKind(), event.getToEmail());
        } catch (Exception ex) {
            log.error("[Kafka] Failed to dispatch appointment event kind={} to={}: {}",
                    event.getKind(), event.getToEmail(), ex.getMessage());
        }
    }

    private void dispatchBillingEvent(BillingEmailEvent event) {
        try {
            producer.sendBillingEvent(event);
            log.debug("[Kafka] Billing event dispatched: kind={} to={}", event.getKind(), event.getToEmail());
        } catch (Exception ex) {
            log.error("[Kafka] Failed to dispatch billing event kind={} to={}: {}",
                    event.getKind(), event.getToEmail(), ex.getMessage());
        }
    }

    private void dispatchUserEvent(UserEmailEvent event) {
        try {
            producer.sendUserEvent(event);
            log.debug("[Kafka] User event dispatched: kind={} to={}", event.getKind(), event.getToEmail());
        } catch (Exception ex) {
            log.error("[Kafka] Failed to dispatch user event kind={} to={}: {}",
                    event.getKind(), event.getToEmail(), ex.getMessage());
        }
    }

    // =========================================================================
    //  PRIVATE — Direct email helper (safe wrapper for non-Kafka path)
    // =========================================================================

    /**
     * Executes a direct EmailService call inside a try-catch.
     * Any exception is caught and logged — it NEVER propagates to the caller.
     *
     * @param label   short identifier for logging (e.g. "appointment-booked")
     * @param toEmail recipient email (for log context)
     * @param action  the EmailService call to execute
     */
    private void safeDirectEmail(String label, String toEmail, Runnable action) {
        try {
            action.run();
            log.debug("[Direct] Email sent: type={} to={}", label, toEmail);
        } catch (Exception ex) {
            log.error("[Direct] Email failed: type={} to={}: {}", label, toEmail, ex.getMessage());
            // Intentionally swallowed — email failure must NOT break business logic
        }
    }
}