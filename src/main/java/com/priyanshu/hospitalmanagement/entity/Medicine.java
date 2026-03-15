package com.priyanshu.hospitalmanagement.entity;

import com.priyanshu.hospitalmanagement.entity.type.MedicineType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String category;

    @Enumerated(EnumType.STRING)
    private MedicineType type;

    private String dosage;

    private String manufacturer;

    private Double price;

    private Integer stock;
}