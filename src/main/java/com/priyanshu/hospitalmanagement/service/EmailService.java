package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.entity.PrescriptionMedicine;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j                  // FIX: was missing — caused log.info/log.error to not compile
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // ─────────────────────────────────────────────────────────────────────────
    // 1. OTP EMAIL
    // ─────────────────────────────────────────────────────────────────────────
    public void sendOtp(String toEmail, String otp) {
        Context context = new Context();
        context.setVariable("otp", otp);
        sendHtmlEmail(
                toEmail,
                "Verify Your Email — City Care Hospital",
                "otp-email",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. APPOINTMENT BOOKED
    // ─────────────────────────────────────────────────────────────────────────
    public void sendAppointmentBooked(String toEmail, String patientName,
                                      String doctorName, LocalDateTime appointmentTime,
                                      String reason) {
        Context context = new Context();
        context.setVariable("patientName", patientName);
        context.setVariable("doctorName", doctorName);
        context.setVariable("appointmentTime", appointmentTime.format(DATE_FMT));
        context.setVariable("reason", reason);
        sendHtmlEmail(
                toEmail,
                "Appointment Confirmed — City Care Hospital",
                "appointment-booked",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. APPOINTMENT CANCELLED
    // ─────────────────────────────────────────────────────────────────────────
    public void sendAppointmentCancelled(String toEmail, String patientName,
                                         LocalDateTime appointmentTime) {
        Context context = new Context();
        context.setVariable("patientName", patientName);
        context.setVariable("appointmentTime", appointmentTime.format(DATE_FMT));
        sendHtmlEmail(
                toEmail,
                "Appointment Cancelled — City Care Hospital",
                "appointment-cancelled",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 4. BILL GENERATED
    // ─────────────────────────────────────────────────────────────────────────
    public void sendBillGenerated(String toEmail, String patientName,
                                  double consultationFee, double gstAmount,
                                  double totalAmount, Long billId) {
        Context context = new Context();
        context.setVariable("patientName", patientName);
        context.setVariable("consultationFee", String.format("%.2f", consultationFee));
        context.setVariable("gstAmount", String.format("%.2f", gstAmount));
        context.setVariable("totalAmount", String.format("%.2f", totalAmount));
        context.setVariable("billId", String.format("INV-%05d", billId));
        sendHtmlEmail(
                toEmail,
                "Invoice Generated — City Care Hospital",
                "bill-generated",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. PAYMENT CONFIRMED
    // ─────────────────────────────────────────────────────────────────────────
    public void sendPaymentConfirmation(String toEmail, String patientName,
                                        double totalAmount, Long billId,
                                        LocalDateTime paidAt) {
        Context context = new Context();
        context.setVariable("patientName", patientName);
        context.setVariable("totalAmount", String.format("%.2f", totalAmount));
        context.setVariable("billId", String.format("INV-%05d", billId));
        context.setVariable("paidAt", paidAt.format(DATE_FMT));
        sendHtmlEmail(
                toEmail,
                "Payment Received — City Care Hospital",
                "payment-confirmed",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 6. PRESCRIPTION ADDED
    // ─────────────────────────────────────────────────────────────────────────
    public void sendPrescriptionAdded(String toEmail, String patientName,
                                      String doctorName, String diagnosis,
                                      List<PrescriptionMedicine> medicines) {
        Context context = new Context();
        context.setVariable("patientName", patientName);
        context.setVariable("doctorName", doctorName);
        context.setVariable("diagnosis", diagnosis);
        context.setVariable("medicines", medicines);
        sendHtmlEmail(
                toEmail,
                "Your Prescription — City Care Hospital",
                "prescription-added",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 7. DOCTOR WELCOME EMAIL
    // Triggered: when admin onboards a new doctor
    // ─────────────────────────────────────────────────────────────────────────
    public void sendDoctorWelcome(String toEmail, String doctorName,
                                  String tempPassword) {
        Context context = new Context();
        context.setVariable("doctorName", doctorName);
        context.setVariable("email", toEmail);
        context.setVariable("tempPassword", tempPassword);
        sendHtmlEmail(
                toEmail,
                "Welcome to City Care Hospital — Your Account Details",
                "welcome",
                context
        );
    }   // FIX: this method was OUTSIDE the class before due to extra } above it

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER — all emails go through here
    // ─────────────────────────────────────────────────────────────────────────
    private void sendHtmlEmail(String toEmail, String subject,
                               String templateName, Context context) {
        try {
            String html = templateEngine.process(templateName, context);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(html, true);

            mailSender.send(message);
            log.info("Email '{}' sent to {}", subject, toEmail);

        } catch (MessagingException e) {
            log.error("Failed to send email '{}' to {}", subject, toEmail, e);
            throw new RuntimeException("Failed to send email: " + subject, e);
        }
    }

    // 8. DOCTOR — NEW APPOINTMENT NOTIFICATION
// Triggered: when a patient books an appointment with this doctor
// ─────────────────────────────────────────────────────────────────────────
    public void sendDoctorNewAppointment(String toEmail, String doctorName,
                                         String patientName, LocalDateTime appointmentTime,
                                         String reason, Long appointmentId) {
        Context context = new Context();
        context.setVariable("doctorName", doctorName);
        context.setVariable("patientName", patientName);
        context.setVariable("appointmentTime", appointmentTime.format(DATE_FMT));
        context.setVariable("reason", reason);
        context.setVariable("appointmentId", appointmentId);
        sendHtmlEmail(
                toEmail,
                "New Appointment Booked — City Care Hospital",
                "doctor-new-appointment",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
// 9. DOCTOR — APPOINTMENT REASSIGNED TO YOU
// Triggered: when an appointment is reassigned to this doctor
// ─────────────────────────────────────────────────────────────────────────
    public void sendDoctorReassigned(String toEmail, String doctorName,
                                     String patientName, LocalDateTime appointmentTime,
                                     String reason, String previousDoctorName,
                                     Long appointmentId) {
        Context context = new Context();
        context.setVariable("doctorName", doctorName);
        context.setVariable("patientName", patientName);
        context.setVariable("appointmentTime", appointmentTime.format(DATE_FMT));
        context.setVariable("reason", reason);
        context.setVariable("previousDoctorName", previousDoctorName);
        context.setVariable("appointmentId", appointmentId);
        sendHtmlEmail(
                toEmail,
                "Appointment Reassigned to You — City Care Hospital",
                "doctor-reassigned",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
// 10. PATIENT — MEDICAL RECORD CREATED
// Triggered: when doctor creates a medical record for the patient
// ─────────────────────────────────────────────────────────────────────────
    public void sendMedicalRecordCreated(String toEmail, String patientName,
                                         String doctorName, String diagnosis,
                                         String notes, String visitDate,
                                         Long recordId) {
        Context context = new Context();
        context.setVariable("patientName", patientName);
        context.setVariable("doctorName", doctorName);
        context.setVariable("diagnosis", diagnosis);
        context.setVariable("notes", notes);
        context.setVariable("visitDate", visitDate);
        context.setVariable("recordId", recordId);
        sendHtmlEmail(
                toEmail,
                "Your Medical Record is Ready — City Care Hospital",
                "medical-record-created",
                context
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
// 11. PATIENT WELCOME EMAIL
// Triggered: when a patient completes profile creation (CreateProfile)
// ─────────────────────────────────────────────────────────────────────────
    public void sendPatientWelcome(String toEmail, String patientName) {
        Context context = new Context();
        context.setVariable("patientName", patientName);
        context.setVariable("email", toEmail);
        sendHtmlEmail(
                toEmail,
                "Welcome to City Care Hospital — Your Account is Ready",
                "patient-welcome",
                context
        );
    }

    // ← single closing brace — class ends here
}