package com.priyanshu.hospitalmanagement.entity;

import com.priyanshu.hospitalmanagement.entity.Appointment;
import com.priyanshu.hospitalmanagement.entity.Insurance;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.entity.type.BloodGroupType;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(
        name = "patient",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "unique_patient_name_birthdate",
                        columnNames = {"name", "birthDate"}
                )
        },
        indexes = {
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
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 40)
    private String name;

    private String fatherName;

    private LocalDate birthDate;

    @Column(unique = true, nullable = false)

    private String email;
    @Column(length = 15)
    private String phone;

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

    private Double height;

    private Double weight;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;


    @ManyToOne(cascade = CascadeType.ALL)
    @JoinColumn(name = "patient_insurance_id")
    private Insurance insurance;

    @ToString.Exclude
    @OneToMany(
            mappedBy = "patient",
            cascade = CascadeType.REMOVE,
            orphanRemoval = true,
            fetch = FetchType.LAZY
    )
    private List<Appointment> appointments = new ArrayList<>();
}