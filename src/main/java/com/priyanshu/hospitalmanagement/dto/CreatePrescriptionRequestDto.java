package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.util.List;

@Data
public class CreatePrescriptionRequestDto {

    private List<MedicineItemDto> medicines;

}