package com.priyanshu.hospitalmanagement.entity;

import com.priyanshu.hospitalmanagement.entity.type.BillStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Bill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    private Double consultationFee;

    private Double gstAmount;       // NEW: 18% of consultationFee

    private Double totalAmount;     // NEW: consultationFee + gstAmount

    @Enumerated(EnumType.STRING)
    private BillStatus status;

    private LocalDateTime createdAt;

    private LocalDateTime paidAt;   // NEW: timestamp when marked PAID
}