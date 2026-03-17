package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByAppointment_Patient_Id(Long patientId);

    boolean existsByAppointmentId(Long appointmentId);
    Optional<Prescription> findByAppointmentId(Long appointmentId);

    List<Prescription> findByAppointment_Doctor_Id(Long doctorId);
}