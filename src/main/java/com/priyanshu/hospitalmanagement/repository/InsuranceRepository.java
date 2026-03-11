package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Insurance;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InsuranceRepository extends JpaRepository<Insurance, Long> {
    boolean existsByPolicyNumber(String policyNumber);
}