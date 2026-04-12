package com.priyanshu.hospitalmanagement.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MedicineEventDto {
    private String medicineName;
    private String frequency;
    private Integer durationDays;
    private Integer quantity;
    private String instructions;
}