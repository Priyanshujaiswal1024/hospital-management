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
import java.util.ArrayList;
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
    private final EmailService emailService;
    private final MedicalRecordRepository medicalRecordRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE APPOINTMENT
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    @Secured("ROLE_PATIENT")
    public AppointmentResponseDto createNewAppointment(
            CreateAppointmentRequestDto dto, Long userId) {

        Patient patient = patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found"));

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Doctor not found: " + dto.getDoctorId()));

        LocalDate appointmentDate = dto.getAppointmentTime().toLocalDate();
        doctorAvailabilityRepository
                .findByDoctorIdAndDate(doctor.getId(), appointmentDate)
                .orElseThrow(() -> new RuntimeException(
                        "Doctor not available on this date"));

        Optional<Appointment> existingAppointment =
                appointmentRepository.findByDoctorAndAppointmentTime(
                        doctor, dto.getAppointmentTime());
        if (existingAppointment.isPresent()) {
            throw new RuntimeException("This slot is already booked for the doctor");
        }

        Appointment appointment = Appointment.builder()
                .appointmentTime(dto.getAppointmentTime())
                .reason(dto.getReason())
                .patient(patient)
                .doctor(doctor)
                .status(AppointmentStatus.BOOKED)
                .build();

        Appointment saved = appointmentRepository.save(appointment);

        emailService.sendAppointmentBooked(
                patient.getUser().getUsername(),
                patient.getName(),
                doctor.getName(),
                saved.getAppointmentTime(),
                saved.getReason()
        );
        emailService.sendDoctorNewAppointment(
                doctor.getEmail(), doctor.getName(),
                patient.getName(), appointment.getAppointmentTime(),
                appointment.getReason(), appointment.getId()
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
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found"));

        Doctor oldDoctor = appointment.getDoctor(); // ← save old doctor BEFORE reassign

        Doctor newDoctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));

        appointment.setDoctor(newDoctor);
        newDoctor.getAppointments().add(appointment);

        // ← ADD THIS
        emailService.sendDoctorReassigned(
                newDoctor.getEmail(),
                newDoctor.getName(),
                appointment.getPatient().getName(),
                appointment.getAppointmentTime(),
                appointment.getReason(),
                oldDoctor.getName(),        // previousDoctorName
                appointment.getId()
        );

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
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));

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

        Patient patient = patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found"));

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
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Appointment is already cancelled");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Cannot cancel a completed appointment");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);

        emailService.sendAppointmentCancelled(
                appointment.getPatient().getUser().getUsername(),
                appointment.getPatient().getName(),
                appointment.getAppointmentTime()
        );
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
                .filter(a -> a.getStatus() == AppointmentStatus.BOOKED
                        || a.getStatus() == AppointmentStatus.CONFIRMED)
                .map(this::mapToResponseDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MARK APPOINTMENT COMPLETED
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public AppointmentResponseDto markAppointmentCompleted(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found"));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new RuntimeException("Cannot complete a cancelled appointment");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new RuntimeException("Appointment already completed");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        return mapToResponseDto(appointmentRepository.save(appointment));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADD PRESCRIPTION
    // FIX 1: Removed diagnosis/notes — those belong to MedicalRecord
    // FIX 2: Replaced Prescription.builder() with new Prescription()
    //         since entity has no @Builder
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void addPrescription(Long appointmentId,
                                CreatePrescriptionRequestDto dto) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found"));

        // Prevent duplicate
        if (prescriptionRepository.existsByAppointmentId(appointmentId)) {
            throw new RuntimeException(
                    "Prescription already exists for appointment: " + appointmentId);
        }

        Prescription prescription = new Prescription();   // FIX 2: no @Builder on entity
        prescription.setAppointment(appointment);
        // FIX 1: NO diagnosis, NO notes

        List<PrescriptionMedicine> prescriptionMedicines = new ArrayList<>();

        if (dto.getMedicines() != null) {
            for (var item : dto.getMedicines()) {
                Medicine medicine = medicineRepository
                        .findById(item.getMedicineId())
                        .orElseThrow(() -> new RuntimeException(
                                "Medicine not found: " + item.getMedicineId()));

                // Stock check
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                if (medicine.getStock() < qty) {
                    throw new RuntimeException(
                            "Insufficient stock for: " + medicine.getName()
                                    + ". Available: " + medicine.getStock()
                                    + ", Required: " + qty);
                }

                PrescriptionMedicine pm = new PrescriptionMedicine();
                pm.setMedicine(medicine);
                pm.setFrequency(item.getFrequency());
                pm.setDurationDays(item.getDurationDays());
                pm.setQuantity(qty);
                pm.setInstructions(item.getInstructions());
                pm.setPrescription(prescription);
                prescriptionMedicines.add(pm);

                // Deduct stock
                medicine.setStock(medicine.getStock() - qty);
                medicineRepository.save(medicine);
            }
        }

        prescription.setMedicines(prescriptionMedicines);
        prescriptionRepository.save(prescription);

        // Send prescription email — no diagnosis since it's not on prescription
        emailService.sendPrescriptionAdded(
                appointment.getPatient().getUser().getUsername(),
                appointment.getPatient().getName(),
                appointment.getDoctor().getName(),
                null,                    // FIX 1: no diagnosis here
                prescriptionMedicines
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────────────────────────────────
    private AppointmentResponseDto mapToResponseDto(Appointment a) {

        Long prescriptionId = prescriptionRepository
                .findByAppointmentId(a.getId())
                .map(Prescription::getId)
                .orElse(null);

        Long medicalRecordId = medicalRecordRepository
                .findByAppointment_Id(a.getId())
                .map(MedicalRecord::getId)
                .orElse(null);

        return AppointmentResponseDto.builder()
                .id(a.getId())
                .appointmentTime(a.getAppointmentTime())
                .reason(a.getReason())
                .doctorName(a.getDoctor().getName())
                .patientName(a.getPatient().getName())
                .status(a.getStatus().name())
                .prescriptionId(prescriptionId)
                .medicalRecordId(medicalRecordId)
                .build();
    }
    @Transactional(readOnly = true)
    public List<AppointmentResponseDto> getAllAppointments(int page, int size) {
        return appointmentRepository
                .findAll(PageRequest.of(page, size))
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }
}