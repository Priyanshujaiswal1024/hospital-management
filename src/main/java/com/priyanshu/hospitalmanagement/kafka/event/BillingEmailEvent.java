package com.priyanshu.hospitalmanagement.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BillingEmailEvent {

    public enum Kind {
        BILL_GENERATED, PAYMENT_CONFIRMED, PRESCRIPTION_ADDED, MEDICAL_RECORD_CREATED
    }

    private Kind kind;
    private String toEmail;
    private String patientName;
    private String doctorName;

    // BILL_GENERATED / PAYMENT_CONFIRMED
    private Double consultationFee;
    private Double gstAmount;
    private Double totalAmount;
    private Long billId;
    private LocalDateTime paidAt;

    // PRESCRIPTION_ADDED
    private List<MedicineEventDto> medicines;

    // MEDICAL_RECORD_CREATED
    private String diagnosis;
    private String notes;
    private String visitDate;
    private Long recordId;
}