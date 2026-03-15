package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
public class InsuranceResponseDto {
    private Long id;
    private String provider;
    private String policyNumber;
    private LocalDate validUntil;
    private LocalDateTime createdAt;
    private Long patientId;

}
