package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
}