package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class InsuranceResponseDto {
    private Long id;
    private String provider;
    private String policyNumber;
    private LocalDate validUntil;

}
