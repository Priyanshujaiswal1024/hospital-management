package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateAppointmentRequestDto {
    private Long doctorId;      // patient just types doctor name
    private LocalDateTime appointmentTime;
    private String reason;

    // removed patientId — get it from JWT token instead
}