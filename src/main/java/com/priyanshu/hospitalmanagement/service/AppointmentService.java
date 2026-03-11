package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.AppointmentResponseDto;
import com.priyanshu.hospitalmanagement.dto.CreateAppointmentRequestDto;
import com.priyanshu.hospitalmanagement.dto.CreatePrescriptionRequestDto;
import com.priyanshu.hospitalmanagement.entity.*;
import com.priyanshu.hospitalmanagement.entity.type.AppointmentStatus;
import com.priyanshu.hospitalmanagement.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final ModelMapper modelMapper;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;

    @Transactional
    @Secured("ROLE_PATIENT")
    public AppointmentResponseDto createNewAppointment(
            CreateAppointmentRequestDto dto, Long userId) {
        System.out.println("JWT userId = " + userId);
        // 1️⃣ Find patient
        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found"));

        // 2️⃣ Find doctor
        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Doctor not found with id: " + dto.getDoctorId()));

        // 3️⃣ Check doctor availability for that date
        LocalDate appointmentDate = dto.getAppointmentTime().toLocalDate();

        DoctorAvailability availability =
                doctorAvailabilityRepository
                        .findByDoctorIdAndDate(doctor.getId(), appointmentDate)
                        .orElseThrow(() ->
                                new RuntimeException("Doctor not available on this date"));

        // 4️⃣ Check slot already booked
        Optional<Appointment> existingAppointment =
                appointmentRepository.findByDoctorAndAppointmentTime(
                        doctor,
                        dto.getAppointmentTime()
                );

        if (existingAppointment.isPresent()) {
            throw new RuntimeException("This slot is already booked for the doctor");
        }

        // 5️⃣ Create appointment
        Appointment appointment = Appointment.builder()
                .appointmentTime(dto.getAppointmentTime())
                .reason(dto.getReason())
                .patient(patient)
                .doctor(doctor)
                .status(AppointmentStatus.SCHEDULED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // 6️⃣ Convert to response
        return mapToResponseDto(saved);
    }

    @Transactional
    @PreAuthorize("hasAuthority('appointment:write') or #doctorId == authentication.principal.id")
    public AppointmentResponseDto reAssignAppointmentToAnotherDoctor(
            Long appointmentId, Long doctorId) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found"));

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));

        appointment.setDoctor(doctor);
        doctor.getAppointments().add(appointment);

        return mapToResponseDto(appointment);
    }

    // @MapsId: Doctor ID == User ID, so findById(userId) works directly
    @PreAuthorize("hasRole('ADMIN') OR (hasRole('DOCTOR') AND #userId == authentication.principal.id)")
    public List<AppointmentResponseDto> getAllAppointmentsOfDoctor(Long userId) {
        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));

        return doctor.getAppointments()
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // @MapsId: Patient ID == User ID, so findById(userId) works directly
    public List<AppointmentResponseDto> getAllAppointmentsOfPatient(
            Long userId, int page, int size) {

        Patient patient = patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found"));

        return appointmentRepository
                .findByPatientId(patient.getId(), PageRequest.of(page, size))
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    private AppointmentResponseDto mapToResponseDto(Appointment appointment) {
        return AppointmentResponseDto.builder()
                .id(appointment.getId())
                .appointmentTime(appointment.getAppointmentTime())
                .reason(appointment.getReason())
                .doctorName(appointment.getDoctor().getName())
                .patientName(appointment.getPatient().getName())
                .status(appointment.getStatus().name())
                .build();
    }
    @Transactional
    @PreAuthorize("hasRole('PATIENT')")
    public void cancelAppointment(Long appointmentId) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found"));

        appointment.setStatus(AppointmentStatus.CANCELLED);
    }
    public void addPrescription(Long appointmentId, CreatePrescriptionRequestDto dto) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        Prescription prescription = Prescription.builder()
                .diagnosis(dto.getDiagnosis())
                .medicines(dto.getMedicines())
                .notes(dto.getNotes())
                .appointment(appointment)
                .build();


        prescriptionRepository.save(prescription);
    }
}