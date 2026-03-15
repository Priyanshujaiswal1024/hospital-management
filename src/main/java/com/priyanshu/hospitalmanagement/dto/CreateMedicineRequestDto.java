package com.priyanshu.hospitalmanagement.dto;

import com.priyanshu.hospitalmanagement.entity.type.MedicineType;
import lombok.Data;

@Data
public class CreateMedicineRequestDto {

    private String name;

    private String category;

    private MedicineType type;

    private String dosage;

    private String manufacturer;

    private Double price;

    private Integer stock;
}