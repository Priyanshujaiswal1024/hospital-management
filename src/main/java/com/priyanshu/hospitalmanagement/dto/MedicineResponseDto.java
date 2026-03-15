package com.priyanshu.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class MedicineResponseDto {

    private Long id;
    private String name;
    private String category;
    private String type;
    private String dosage;
    private String manufacturer;
    private Double price;
    private Integer stock;
    private boolean lowStock;           // true if stock <= 10
}