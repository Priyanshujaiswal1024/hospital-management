package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class UpdatePatientRequestDto {

    // User fields
    private String phone;           // stored on User entity

    // Patient fields
    private String address;
    private String city;            // ← was missing
    private String state;           // ← was missing
    private String pincode;         // ← was missing
    private String emergencyContactName;   // ← was missing
    private String emergencyContactPhone;  // ← was missing
    private Double height;          // ← was missing
    private Double weight;          // ← was missing
}