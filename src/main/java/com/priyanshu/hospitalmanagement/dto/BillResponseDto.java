package com.priyanshu.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BillResponseDto {

    private Long id;
    private Long appointmentId;

    private String patientName;         // NEW: for admin billing table
    private String doctorName;          // NEW: for admin billing table

    private Double consultationFee;
    private Double gstAmount;           // NEW: 18% GST breakdown
    private Double totalAmount;         // NEW: consultationFee + gstAmount

    private String status;             // PAID / UNPAID
    private LocalDateTime createdAt;
    private LocalDateTime paidAt;       // NEW: set when marked as paid
}