package com.priyanshu.hospitalmanagement.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
//import org.springframework.data.annotation.Id;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "prescription_medicine")
public class PrescriptionMedicine {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "prescription_id")  // must match FK constraint
    private Prescription prescription;

    @ManyToOne
    private Medicine medicine;

    private String frequency;

    private Integer durationDays;

    private String instructions;

    private Integer quantity;
}