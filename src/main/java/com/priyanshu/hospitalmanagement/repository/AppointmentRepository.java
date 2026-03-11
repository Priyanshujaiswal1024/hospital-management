package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Appointment;
import com.priyanshu.hospitalmanagement.entity.Doctor;
import com.priyanshu.hospitalmanagement.entity.Patient;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctor(Doctor doctor);
    List<Appointment> findByPatient(Patient patient);
    Optional<Appointment> findByDoctorAndAppointmentTime(
            Doctor doctor,
            LocalDateTime appointmentTime
    );
    long count();

    long countByAppointmentTimeBetween(LocalDateTime start, LocalDateTime end);
    List<Appointment> findByDoctorIdAndAppointmentTimeBetween(Long doctorId, LocalDateTime start, LocalDateTime end);

    List<Appointment> findByPatientId(Long patientId, Pageable pageable);
}