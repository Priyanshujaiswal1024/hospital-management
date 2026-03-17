package com.priyanshu.hospitalmanagement.dto;

import com.priyanshu.hospitalmanagement.entity.type.BloodGroupType;
import lombok.Data;
import java.time.LocalDate;

@Data
public class UpdatePatientProfileRequestDto {

    // Personal — ab update ho sakenge
    private String name;
    private String fatherName;
    private String gender;
    private LocalDate birthDate;
    private BloodGroupType bloodGroup;

    // Contact
    private String phone;

    // Address
    private String address;
    private String city;
    private String state;
    private String pincode;

    // Emergency
    private String emergencyContactName;
    private String emergencyContactPhone;

    // Health
    private Double height;
    private Double weight;

    // ❌ insuranceId hata diya — alag endpoint hai: POST /patient/insurance
}