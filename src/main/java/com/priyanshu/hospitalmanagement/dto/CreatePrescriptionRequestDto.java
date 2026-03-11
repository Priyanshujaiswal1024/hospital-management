package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class CreatePrescriptionRequestDto {

    private String diagnosis;
    private String medicines;
    private String notes;

}