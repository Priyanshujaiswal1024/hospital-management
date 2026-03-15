package com.priyanshu.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class PrescriptionResponseDto {

    private Long id;
    private String diagnosis;
    private String notes;

    // FIX: Was List<PrescriptionMedicine> (raw entity) — now proper DTO list
    private List<PrescriptionMedicineResponseDto> medicines;

    private Long appointmentId;
    private LocalDateTime createdAt;
}