package com.priyanshu.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppointmentResponseDto {
    private Long id;
    private LocalDateTime appointmentTime;
    private String reason;
    private String doctorName;    // ← add this
    private String patientName;   // ← add this
    private String status;
    private Long medicalRecordId;
    private Long prescriptionId;    // ✅ null if not written
}