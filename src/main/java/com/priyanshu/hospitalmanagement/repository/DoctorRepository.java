package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Department;
import com.priyanshu.hospitalmanagement.entity.Doctor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DoctorRepository extends JpaRepository<Doctor, Long> {
    Optional<Doctor> findByNameIgnoreCase(String name);
    List<Doctor> findByNameContainingIgnoreCase(String name);


        long count();
    List<Doctor> findBySpecializationIgnoreCase(String specialization);

    Page<Doctor> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Doctor> findBySpecializationIgnoreCase(String specialization, Pageable pageable);

    Page<Doctor> findByNameContainingIgnoreCaseAndSpecializationIgnoreCase(
            String name,
            String specialization,
            Pageable pageable);

    List<Doctor> findByDepartments(Department department);
}