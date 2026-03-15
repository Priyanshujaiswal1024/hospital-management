package com.priyanshu.hospitalmanagement.entity;

import com.priyanshu.hospitalmanagement.entity.type.BloodGroupType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "patient",
        indexes = {
                // FIX: removed uniqueConstraint on name+birthDate
                // two patients can have same name and birthday
                @Index(name = "idx_patient_birth_date", columnList = "birthDate")
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Patient {

    @Id
    // FIX 2: @MapsId — Patient ID now equals User ID
    // consistent with Doctor entity
    // patientRepository.findById(userId) now works correctly
    private Long id;

    @OneToOne
    @MapsId                             // ← Patient ID = User ID
    @JoinColumn(name = "user_id")
    private User user;

    // FIX 1: removed duplicate email and phone fields
    // email → patient.getUser().getUsername()
    // phone → patient.getUser().getPhone()
    // having them here caused data inconsistency on update

    @Column(nullable = false, length = 40)
    private String name;

    private String fatherName;

    private LocalDate birthDate;

    private String gender;

    @Column(length = 450)
    private String address;

    private String city;

    private String state;

    private String pincode;

    private String emergencyContactName;

    private String emergencyContactPhone;

    @Enumerated(EnumType.STRING)
    private BloodGroupType bloodGroup;

    private Double height;              // in cm

    private Double weight;              // in kg

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(mappedBy = "patient", cascade = CascadeType.ALL)
    private Insurance insurance;

    @Builder.Default                    // FIX: prevent NPE when using builder
    @ToString.Exclude
    @OneToMany(
            mappedBy = "patient",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<Appointment> appointments = new ArrayList<>();
}