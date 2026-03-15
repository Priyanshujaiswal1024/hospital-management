package com.priyanshu.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class MedicalRecordResponseDto {

    private Long id;
    private String diagnosis;
    private String notes;
    private Long patientId;
    private Long doctorId;
    private Long appointmentId;  private String patientName;   // ← ADD

    private String doctorName;
    private Long prescriptionId;        // NEW: null if no prescription linked
    private LocalDateTime visitDate;
}