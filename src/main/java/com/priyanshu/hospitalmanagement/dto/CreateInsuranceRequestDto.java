package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateInsuranceRequestDto {

    private String provider;
    private String policyNumber;
    private LocalDate validUntil;

}