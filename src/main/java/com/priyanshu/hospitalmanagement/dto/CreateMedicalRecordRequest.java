package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class CreateMedicalRecordRequest {

    private Long patientId;
    private Long doctorId;

    private String symptoms;
    private String diagnosis;
    private String treatment;
    private String medicines;
    private String testsRecommended;
    private String notes;

    private LocalDate followUpDate;

}