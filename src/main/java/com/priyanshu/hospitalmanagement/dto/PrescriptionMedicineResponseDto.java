package com.priyanshu.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PrescriptionMedicineResponseDto {

    private Long medicineId;
    private String medicineName;   // actual name, not entity toString()

    private String frequency;      // "Twice daily"
    private Integer durationDays;  // 30
    private Integer quantity;      // 60
    private String instructions;   // "After meals"
}