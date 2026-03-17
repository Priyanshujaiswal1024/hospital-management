package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.entity.Insurance;
import com.priyanshu.hospitalmanagement.entity.UserPrincipal;
import com.priyanshu.hospitalmanagement.service.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final AppointmentService appointmentService;
    private final PrescriptionService prescriptionService;
    private final MedicalRecordService medicalRecordService;
    private final InsuranceService insuranceService;

    // ─────────────────────────────────────────────────────────────────────────
    // PROFILE
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/profile")
    public ResponseEntity<PatientResponseDto> getPatientProfile() {
        try {
            return ResponseEntity.ok(
                    patientService.getPatientByUserId(getPrincipal().getId()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PostMapping("/profile")
    public ResponseEntity<PatientResponseDto> createPatientProfile(
            @RequestBody CreatePatientProfileRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patientService.createPatientProfile(dto));
    }

    @PutMapping("/profile")
    public ResponseEntity<PatientResponseDto> updateProfile(
            @RequestBody UpdatePatientProfileRequestDto dto) {
        return ResponseEntity.ok(patientService.updatePatientProfile(dto));
    }

    @PatchMapping("/profile")
    public ResponseEntity<PatientResponseDto> patchProfile(
            @RequestBody UpdatePatientProfileRequestDto dto) {
        return ResponseEntity.ok(patientService.updatePatientProfile(dto));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INSURANCE
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/insurance")
    public ResponseEntity<InsuranceResponseDto> getMyInsurance() {
        return ResponseEntity.ok(insuranceService.getMyInsurance());
    }

    @PostMapping("/insurance")
    public ResponseEntity<InsuranceResponseDto> addOrUpdateInsurance(
            @RequestBody CreateInsuranceRequestDto dto) {

        Insurance insurance = new Insurance();
        insurance.setProvider(dto.getProvider());
        insurance.setPolicyNumber(dto.getPolicyNumber());
        insurance.setValidUntil(dto.getValidUntil());

        return ResponseEntity.ok(
                insuranceService.assignInsuranceToPatient(
                        getPrincipal().getId(), insurance));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // APPOINTMENTS
    // ─────────────────────────────────────────────────────────────────────────
    @PostMapping("/appointments")
    public ResponseEntity<AppointmentResponseDto> createNewAppointment(
            @RequestBody CreateAppointmentRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createNewAppointment(
                        dto, getPrincipal().getId()));
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getAllAppointments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(
                appointmentService.getAllAppointmentsOfPatient(
                        getPrincipal().getId(), page, size));
    }

    @GetMapping("/appointments/upcoming")
    public ResponseEntity<List<AppointmentResponseDto>> getUpcomingAppointments() {
        return ResponseEntity.ok(
                appointmentService.getAllAppointmentsOfPatient(
                                getPrincipal().getId(), 0, 100)
                        .stream()
                        .filter(a -> a.getStatus().equals("BOOKED")
                                || a.getStatus().equals("CONFIRMED"))
                        .toList());
    }

    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {
        appointmentService.cancelAppointment(id);
        return ResponseEntity.noContent().build();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRESCRIPTIONS
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/prescriptions")
    public ResponseEntity<List<PrescriptionResponseDto>> getMyPrescriptions(
            Authentication authentication) {
        return ResponseEntity.ok(
                prescriptionService.getPrescriptionsForLoggedInPatient(
                        authentication.getName()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // MEDICAL RECORDS
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping("/medical-records")
    public ResponseEntity<List<MedicalRecordResponseDto>> getMyMedicalRecords(
            Authentication authentication) {
        return ResponseEntity.ok(
                medicalRecordService.getMedicalRecordsForLoggedInPatient(
                        authentication.getName()));
    }

    @GetMapping("/medical-records/{recordId}/download")
    public ResponseEntity<byte[]> downloadMedicalRecord(
            @PathVariable Long recordId,
            Authentication authentication) throws Exception {
        byte[] pdf = medicalRecordService.downloadMedicalRecordPdf(
                recordId, authentication.getName());
        return ResponseEntity.ok()
                .header("Content-Type", "application/pdf")
                .header("Content-Disposition",
                        "attachment; filename=medical-record-" + recordId + ".pdf")
                .body(pdf);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────────────────────────────────
    private UserPrincipal getPrincipal() {
        return (UserPrincipal) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }
}