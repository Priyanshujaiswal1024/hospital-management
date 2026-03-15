package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.AppointmentResponseDto;
import com.priyanshu.hospitalmanagement.dto.CreateAppointmentRequestDto;
import com.priyanshu.hospitalmanagement.dto.CreatePrescriptionRequestDto;
import com.priyanshu.hospitalmanagement.entity.*;
import com.priyanshu.hospitalmanagement.entity.type.AppointmentStatus;
import com.priyanshu.hospitalmanagement.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final MedicineRepository medicineRepository;
    private final EmailService emailService;    // ← for booking/cancel emails

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE APPOINTMENT
    // FIX: findByUserId → findById (Patient ID == User ID via @MapsId)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    @Secured("ROLE_PATIENT")
    public AppointmentResponseDto createNewAppointment(
            CreateAppointmentRequestDto dto, Long userId) {

        // FIX: findById works now because Patient ID == User ID via @MapsId
        Patient patient = patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found"));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Doctor not found: " + dto.getDoctorId()));

        // Check doctor availability
        LocalDate appointmentDate = dto.getAppointmentTime().toLocalDate();
        doctorAvailabilityRepository
                .findByDoctorIdAndDate(doctor.getId(), appointmentDate)
                .orElseThrow(() -> new RuntimeException(
                        "Doctor not available on this date"));

        // Check slot not already booked
        Optional<Appointment> existingAppointment =
                appointmentRepository.findByDoctorAndAppointmentTime(
                        doctor, dto.getAppointmentTime());
        if (existingAppointment.isPresent()) {
            throw new RuntimeException(
                    "This slot is already booked for the doctor");
        }

        Appointment appointment = Appointment.builder()
                .appointmentTime(dto.getAppointmentTime())
                .reason(dto.getReason())
                .patient(patient)
                .doctor(doctor)
                .status(AppointmentStatus.BOOKED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        // Send booking confirmation email to patient
        emailService.sendAppointmentBooked(
                patient.getUser().getUsername(),  // email = username
                patient.getName(),
                doctor.getName(),
                saved.getAppointmentTime(),
                saved.getReason()
        );

        return mapToResponseDto(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REASSIGN APPOINTMENT TO ANOTHER DOCTOR
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    @PreAuthorize("hasAuthority('appointment:write') " +
            "or #doctorId == authentication.principal.id")
    public AppointmentResponseDto reAssignAppointmentToAnotherDoctor(
            Long appointmentId, Long doctorId) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Appointment not found"));

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Doctor not found"));

        appointment.setDoctor(doctor);
        doctor.getAppointments().add(appointment);

        return mapToResponseDto(appointment);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ALL APPOINTMENTS OF DOCTOR
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    @PreAuthorize("hasRole('ADMIN') OR " +
            "(hasRole('DOCTOR') AND #userId == authentication.principal.id)")
    public List<AppointmentResponseDto> getAllAppointmentsOfDoctor(Long userId) {

        Doctor doctor = doctorRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Doctor not found"));

        return doctor.getAppointments()
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ALL APPOINTMENTS OF PATIENT (paginated)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> getAllAppointmentsOfPatient(
            Long userId, int page, int size) {

        // Patient ID == User ID via @MapsId
        Patient patient = patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found"));

        return appointmentRepository
                .findByPatientId(patient.getId(), PageRequest.of(page, size))
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // CANCEL APPOINTMENT
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    @PreAuthorize("hasRole('PATIENT')")
    public void cancelAppointment(Long appointmentId) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Appointment is already cancelled");
        }

        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed appointment");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);

        // Send cancellation email to patient
        emailService.sendAppointmentCancelled(
                appointment.getPatient().getUser().getUsername(),
                appointment.getPatient().getName(),
                appointment.getAppointmentTime()
        );
    }
    // ─────────────────────────────────────────────────────────────────────────
// GET UPCOMING APPOINTMENTS — PATIENT
// ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> getUpcomingAppointmentsForPatient(Long userId) {

        patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found"));

        return appointmentRepository
                .findByPatientIdAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
                        userId, LocalDateTime.now())
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
// GET UPCOMING APPOINTMENTS — DOCTOR
// ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> getUpcomingAppointmentsForDoctor(Long userId) {

        doctorRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));

        return appointmentRepository
                .findByDoctorIdAndAppointmentTimeAfterOrderByAppointmentTimeAsc(
                        userId, LocalDateTime.now())
                .stream()
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }
    // ─────────────────────────────────────────────────────────────────────────
    // ADD PRESCRIPTION
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void addPrescription(Long appointmentId,
                                CreatePrescriptionRequestDto dto) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException(
                        "Appointment not found"));

        List<PrescriptionMedicine> prescriptionMedicines = dto.getMedicines()
                .stream()
                .map(item -> {
                    Medicine medicine = medicineRepository
                            .findById(item.getMedicineId())
                            .orElseThrow(() -> new RuntimeException(
                                    "Medicine not found: " + item.getMedicineId()));

                    PrescriptionMedicine pm = new PrescriptionMedicine();
                    pm.setMedicine(medicine);
                    pm.setFrequency(item.getFrequency());
                    pm.setDurationDays(item.getDurationDays());
                    pm.setQuantity(item.getQuantity());
                    pm.setInstructions(item.getInstructions());
                    return pm;
                })
                .collect(Collectors.toList());

        Prescription prescription = Prescription.builder()
                .diagnosis(dto.getDiagnosis())
                .medicines(prescriptionMedicines)
                .notes(dto.getNotes())
                .appointment(appointment)
                .build();

        prescriptionMedicines.forEach(pm -> pm.setPrescription(prescription));
        prescriptionRepository.save(prescription);

        // Send prescription email to patient
        emailService.sendPrescriptionAdded(
                appointment.getPatient().getUser().getUsername(),
                appointment.getPatient().getName(),
                appointment.getDoctor().getName(),
                dto.getDiagnosis(),
                prescriptionMedicines
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────────────────────────────────
    private AppointmentResponseDto mapToResponseDto(Appointment a) {
        return AppointmentResponseDto.builder()
                .id(a.getId())
                .appointmentTime(a.getAppointmentTime())
                .reason(a.getReason())
                .doctorName(a.getDoctor().getName())
                .patientName(a.getPatient().getName())
                .status(a.getStatus().name())
                .build();
    }
}