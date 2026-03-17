package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, Long> {

    List<MedicalRecord> findByPatient_Id(Long patientId);

    // FIX: For duplicate record guard per appointment
    boolean existsByAppointment_Id(Long appointmentId);

    // Ye already hona chahiye:
    Optional<MedicalRecord> findByAppointment_Id(Long appointmentId);

    List<MedicalRecord> findByDoctor_Id(Long doctorId);
}

