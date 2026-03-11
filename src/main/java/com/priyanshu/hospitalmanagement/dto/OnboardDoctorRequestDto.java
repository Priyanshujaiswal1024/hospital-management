package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class OnboardDoctorRequestDto {
    private Long userId;
    private String specialization;
    private String email;
    private String name;
}
