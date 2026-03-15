package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Appointment;
import com.priyanshu.hospitalmanagement.entity.Doctor;
import com.priyanshu.hospitalmanagement.entity.Patient;
import com.priyanshu.hospitalmanagement.entity.type.AppointmentStatus;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctor(Doctor doctor);
    List<Appointment> findByPatient(Patient patient);

    Optional<Appointment> findByDoctorAndAppointmentTime(
            Doctor doctor,
            LocalDateTime appointmentTime);

    List<Appointment> findByPatientId(Long patientId, Pageable pageable);

    List<Appointment> findByDoctorIdAndAppointmentTimeBetween(
            Long doctorId, LocalDateTime start, LocalDateTime end);

    long countByAppointmentTimeBetween(LocalDateTime start, LocalDateTime end);
    long countByStatus(AppointmentStatus status);

    // ← countByStockLessThanEqual REMOVED — stock belongs to Medicine, not Appointment

    @Query("""
           SELECT COUNT(a) FROM Appointment a
           WHERE CAST(a.appointmentTime AS date) = CURRENT_DATE
           """)
    long countTodayAppointments();
    // ✅ ADD THESE — use appointmentTime (LocalDateTime) instead
    List<Appointment> findByPatientIdAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
            Long patientId, LocalDateTime dateTime);

    List<Appointment> findByDoctorIdAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
            Long doctorId, LocalDateTime dateTime);
}