package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.entity.MedicalRecord;
import com.priyanshu.hospitalmanagement.entity.UserPrincipal;
import com.priyanshu.hospitalmanagement.repository.InsuranceRepository;
import com.priyanshu.hospitalmanagement.repository.MedicalRecordRepository;
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
  private final   PrescriptionService prescriptionService;
  private final MedicalRecordRepository medicalRecordRepository;
  private final InsuranceService insuranceService;

    /*
     -----------------------------------------
     Get Patient Profile
     -----------------------------------------
     */
    @GetMapping("/profile")
    public ResponseEntity<PatientResponseDto> getPatientProfile() {

        UserPrincipal userPrincipal =
                (UserPrincipal) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        try {
            return ResponseEntity.ok(
                    patientService.getPatientByUserId(userPrincipal.getId()));
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build(); // 404
        }
    }


    /*
     -----------------------------------------
     Create Patient Profile
     -----------------------------------------
     */
    @PostMapping("/profile")
    public ResponseEntity<PatientResponseDto> createPatientProfile(
            @RequestBody CreatePatientProfileRequestDto dto) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patientService.createPatientProfile(dto));
    }


    /*
     -----------------------------------------
     Update Patient Profile
     -----------------------------------------
     */
    // PatientController.java mein bhi:
    @PutMapping("/profile")
    public PatientResponseDto updateProfile(
            @RequestBody UpdatePatientProfileRequestDto dto, // ← same naam
            Authentication authentication) {
        return patientService.updatePatientProfile(dto);
    }

    @PatchMapping("/profile")
    public PatientResponseDto patchProfile(
            @RequestBody UpdatePatientProfileRequestDto dto) { // ← same naam
        return patientService.updatePatientProfile(dto);
    }
    /*
     -----------------------------------------
     Add Insurance
     -----------------------------------------
     */


    /*
     -----------------------------------------
     Create Appointment
     -----------------------------------------
     */
    @PostMapping("/appointments")
    public ResponseEntity<AppointmentResponseDto> createNewAppointment(
            @RequestBody CreateAppointmentRequestDto dto) {

        UserPrincipal userPrincipal =
                (UserPrincipal) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createNewAppointment(
                        dto,
                        userPrincipal.getId()
                ));
    }
    @GetMapping("/insurance")
    public ResponseEntity<InsuranceResponseDto> getMyInsurance() {
        return ResponseEntity.ok(insuranceService.getMyInsurance());
    }

    /*
     -----------------------------------------
     Cancel Appointment
     -----------------------------------------
     */
    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<Void> cancelAppointment(@PathVariable Long id) {

        appointmentService.cancelAppointment(id);

        return ResponseEntity.noContent().build();
    }


    /*
     -----------------------------------------
     Get All Appointments of Patient
     -----------------------------------------
     */
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getAllAppointments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        UserPrincipal userPrincipal =
                (UserPrincipal) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        return ResponseEntity.ok(
                appointmentService.getAllAppointmentsOfPatient(
                        userPrincipal.getId(),
                        page,
                        size
                ));
    }
    @GetMapping("/appointments/upcoming")
    public ResponseEntity<List<AppointmentResponseDto>> getUpcomingAppointments() {

        UserPrincipal userPrincipal =
                (UserPrincipal) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        return ResponseEntity.ok(
                appointmentService.getUpcomingAppointmentsForPatient(
                        userPrincipal.getId()
                )
        );
    }

    @PostMapping("/insurance")
    public ResponseEntity<InsuranceResponseDto> addInsurance(
            @RequestBody CreateInsuranceRequestDto dto) {

        UserPrincipal userPrincipal =
                (UserPrincipal) SecurityContextHolder
                        .getContext()
                        .getAuthentication()
                        .getPrincipal();

        InsuranceResponseDto response =
                patientService.addInsurance(userPrincipal.getId(), dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    @GetMapping("/Prescription")

    public List<PrescriptionResponseDto> getMyPrescriptions(Authentication authentication) {

        String username = authentication.getName();

        return prescriptionService.getPrescriptionsForLoggedInPatient(username);
    }
//    @GetMapping("/{patientId}/medical-record")
//    public ResponseEntity<List<MedicalRecordResponseDto>> getPatientRecords(
//            @PathVariable Long patientId
//    ) {
//
//        List<MedicalRecord> records =
//                medicalRecordRepository.findByPatient_Id(patientId);
//
//        return ResponseEntity.ok(
//                records.stream()
//                        .map(r -> MedicalRecordResponseDto.builder()
//                                .id(r.getId())
//                                .diagnosis(r.getDiagnosis())
//                                .notes(r.getNotes())
//                                .patientId(r.getPatient().getId())
//                                .doctorId(r.getDoctor().getId())
//                                .appointmentId(r.getAppointment().getId())
//                                .visitDate(r.getVisitDate())
//                                .build())
//                        .toList()
//        );
//    }
}
