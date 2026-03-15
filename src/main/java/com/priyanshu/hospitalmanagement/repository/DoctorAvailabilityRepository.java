package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.DoctorAvailability;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DoctorAvailabilityRepository extends JpaRepository<DoctorAvailability, Long> {

    // Used by AppointmentService — check doctor is available on a date
    Optional<DoctorAvailability> findByDoctorIdAndDate(Long doctorId, LocalDate date);

    // Used by DoctorService.addDoctorAvailability() — prevent duplicate slots
    // THIS WAS MISSING — caused the compile error
    boolean existsByDoctorIdAndDate(Long doctorId, LocalDate date);

    // Used by admin to see all availability for a doctor
    List<DoctorAvailability> findByDoctorId(Long doctorId);

    // Used to clean up past availability records
    List<DoctorAvailability> findByDoctorIdAndDateAfter(Long doctorId, LocalDate date);
}