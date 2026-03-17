package com.priyanshu.hospitalmanagement.entity;

import com.priyanshu.hospitalmanagement.entity.Appointment;
import com.priyanshu.hospitalmanagement.entity.Doctor;
import com.priyanshu.hospitalmanagement.entity.Patient;
import com.priyanshu.hospitalmanagement.entity.Prescription;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class MedicalRecord {

   @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ✅ Doctor writes this
    private String diagnosis;
    private String notes;

    private String symptoms;
    private String testsRecommended;
    private String treatmentPlan;

    private LocalDateTime visitDate;

    // ✅ Auto-filled
    @ManyToOne
    private Patient patient;

    @ManyToOne
    private Doctor doctor;

    @OneToOne
    @JoinColumn(name = "appointment_id")
    private Appointment appointment;

    // ✅ Link to prescription
    @OneToOne(mappedBy = "medicalRecord", cascade = CascadeType.ALL)
    private Prescription prescription;
}