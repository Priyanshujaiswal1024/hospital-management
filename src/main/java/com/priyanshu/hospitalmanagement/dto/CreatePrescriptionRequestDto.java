package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreatePrescriptionRequestDto {

    private String diagnosis;

    private String notes;
    private List<MedicineItemDto> medicines;

}