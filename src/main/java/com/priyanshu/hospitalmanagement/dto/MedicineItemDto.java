package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class MedicineItemDto {

    private Long medicineId;

    private String frequency;

    private Integer durationDays;

    private String instructions;

    private Integer quantity;

}