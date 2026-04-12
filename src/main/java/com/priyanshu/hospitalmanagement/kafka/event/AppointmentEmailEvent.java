package com.priyanshu.hospitalmanagement.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AppointmentEmailEvent {

    public enum Kind {
        BOOKED, CANCELLED, DOCTOR_NEW, DOCTOR_REASSIGNED
    }

    private Kind kind;
    private String toEmail;
    private String patientName;
    private String doctorName;
    private String previousDoctorName;   // only DOCTOR_REASSIGNED
    private LocalDateTime appointmentTime;
    private String reason;
    private Long appointmentId;
}