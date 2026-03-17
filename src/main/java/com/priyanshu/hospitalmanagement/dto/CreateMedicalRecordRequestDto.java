package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.time.LocalDate;


@Data
public class CreateMedicalRecordRequestDto {
    private Long appointmentId;      // required
    private Long prescriptionId;
     // ✅ REQUIRED

    private String symptoms;      // optional
    private String diagnosis;     // ✅ main
    private String treatmentPlan; // ✅ renamed (better)

    private String testsRecommended; // optional
    private String notes;            // ✅ main

    private LocalDate followUpDate;  // optional
}