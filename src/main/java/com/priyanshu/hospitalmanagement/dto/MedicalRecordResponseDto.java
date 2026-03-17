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

    private Long appointmentId;

    private Long patientId;
    private String patientName;

    private Long doctorId;
    private String doctorName;

    private Long prescriptionId;

    private LocalDateTime visitDate;
}