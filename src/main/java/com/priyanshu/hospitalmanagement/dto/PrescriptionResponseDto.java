package com.priyanshu.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PrescriptionResponseDto {

    private Long id;

    private List<PrescriptionMedicineResponseDto> medicines;

    private Long appointmentId;

    private String patientName;
    private String doctorName;

    private LocalDateTime createdAt;
}