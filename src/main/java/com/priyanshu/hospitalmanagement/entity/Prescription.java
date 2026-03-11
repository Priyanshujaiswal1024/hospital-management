package com.priyanshu.hospitalmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Prescription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String diagnosis;

    @Column(length = 1000)
    private String medicines;

    @Column(length = 1000)
    private String notes;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;
}