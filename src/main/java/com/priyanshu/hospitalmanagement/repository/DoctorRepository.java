package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Doctor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByNameIgnoreCase(String name);
    List<Doctor> findByNameContainingIgnoreCase(String name);
    Optional<Doctor> findByNameIgnoreCaseAndSpecializationIgnoreCase(
            String name, String specialization);

    List<Doctor> findByNameContainingIgnoreCaseAndSpecializationIgnoreCase(String name, String specialization);
        long count();
    List<Doctor> findBySpecializationIgnoreCase(String specialization);
}