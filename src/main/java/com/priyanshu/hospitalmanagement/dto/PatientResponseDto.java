package com.priyanshu.hospitalmanagement.dto;

import com.priyanshu.hospitalmanagement.entity.type.BloodGroupType;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class PatientResponseDto {

    private Long id;
    private String name;
    private String fatherName;
    private LocalDate birthDate;
    private String gender;

    // From User entity — not Patient directly
    private String email;
    private String phone;

    private String address;
    private String city;
    private String state;
    private String pincode;

    private String emergencyContactName;
    private String emergencyContactPhone;

    private BloodGroupType bloodGroup;
    private Double height;
    private Double weight;

    private LocalDateTime createdAt;    // ← was missing — caused setCreatedAt() error
}