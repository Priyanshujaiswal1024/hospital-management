package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.util.Set;

@Data
public class DoctorResponseDto {

    private Long id;
    private String name;
    private String email;
    private String specialization;
    private Double consultationFee;
    private Integer experienceYears;
    private String phoneNumber;
    private String bio;
    private String profileImageUrl;
    private Set<String> departments;    // just names, not full entities
}