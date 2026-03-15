package com.priyanshu.hospitalmanagement.dto;

import com.priyanshu.hospitalmanagement.entity.type.MedicineType;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class MedicineRequestDto {

    @NotBlank(message = "Medicine name is required")
    private String name;

    private String category;

    private MedicineType type;          // TABLET, SYRUP, INJECTION, CAPSULE, etc.

    private String dosage;              // "500mg", "10mg/5ml"

    private String manufacturer;

    @PositiveOrZero(message = "Price must be >= 0")
    private Double price;

    @NotNull(message = "Stock is required")
    @PositiveOrZero(message = "Stock must be >= 0")
    private Integer stock;
}