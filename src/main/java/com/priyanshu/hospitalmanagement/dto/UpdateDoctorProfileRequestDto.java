package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class UpdateDoctorProfileRequestDto {
    private String phoneNumber;  // ✅ edit kar sakta hai
    private String bio;          // ✅ edit kar sakta hai
    // name, specialization, fee → Admin manage karta hai ❌
}