package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    Optional<DoctorAvailability> findByDoctorIdAndDate(Long doctorId, LocalDate date);

}