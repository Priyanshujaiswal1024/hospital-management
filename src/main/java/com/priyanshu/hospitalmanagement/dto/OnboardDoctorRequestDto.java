package com.priyanshu.hospitalmanagement.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class OnboardDoctorRequestDto {

    // The user account that will become a doctor
    @NotNull
    private Long userId;

    @NotBlank
    private String name;

    // username == email per your requirement
    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String password;        // used to create the User account

    @NotBlank
    private String specialization;

    @NotNull
    @Positive
    private Double consultationFee;

    @NotNull
    @Min(0) @Max(60)
    private Integer experienceYears;

    @Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
    private String phoneNumber;

    private String bio;
    private String profileImageUrl;

    private Long departmentId;      // optional — assign to department on onboarding
}