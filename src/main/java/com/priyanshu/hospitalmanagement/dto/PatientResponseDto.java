package com.priyanshu.hospitalmanagement.dto;

import com.priyanshu.hospitalmanagement.entity.type.BloodGroupType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PatientResponseDto {

    private Long id;

    private String name;
    private String fatherName;
    private LocalDate birthDate;

    private String email;
    private String phone;

    private String gender;

    private String address;
    private String city;
    private String state;
    private String pincode;

    private String emergencyContactName;
    private String emergencyContactPhone;

    private BloodGroupType bloodGroup;

    private Double height;
    private Double weight;

    private InsuranceResponseDto insurance;
}