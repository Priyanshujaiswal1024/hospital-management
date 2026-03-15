package com.priyanshu.hospitalmanagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Doctor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @MapsId
    private User user;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String specialization;

    // username behaves as email per your requirement
    @Column(unique = true, length = 100)
    private String email;

    @Column(nullable = false)
    private Double consultationFee;

    // ── New fields ────────────────────────────────────────────────────────
    @Column
    private Integer experienceYears;        // e.g. 10 years of experience

    @Column(length = 15)
    private String phoneNumber;             // doctor's contact number

    @Column(length = 255)
    private String profileImageUrl;         // photo for patient-facing UI

    @Column(length = 500)
    private String bio;                     // short description shown to patients

    // ── Relationships ─────────────────────────────────────────────────────
    @ToString.Exclude
    @ManyToMany(mappedBy = "doctors")
    private Set<Department> departments = new HashSet<>();

    @ToString.Exclude
    @OneToMany(mappedBy = "doctor")
    private List<Appointment> appointments = new ArrayList<>();

    @ToString.Exclude
    @OneToMany(mappedBy = "doctor", cascade = CascadeType.ALL)
    private List<DoctorAvailability> availabilities = new ArrayList<>();
}