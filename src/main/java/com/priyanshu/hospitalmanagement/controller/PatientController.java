package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.entity.UserPrincipal;
import com.priyanshu.hospitalmanagement.service.AppointmentService;
import com.priyanshu.hospitalmanagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final AppointmentService appointmentService;


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

        return ResponseEntity.ok(
                patientService.getPatientByUserId(userPrincipal.getId()));
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
    @PutMapping("/profile/{id}")
    public ResponseEntity<PatientResponseDto> updatePatientProfile(
            @PathVariable Long id,
            @RequestBody CreatePatientProfileRequestDto dto) {

        return ResponseEntity.ok(
                patientService.updatePatientProfile(id, dto));
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

    @PostMapping("/{patientId}/insurance")
    public ResponseEntity<InsuranceResponseDto> addInsurance(
            @PathVariable Long patientId,
            @RequestBody CreateInsuranceRequestDto dto) {

        InsuranceResponseDto response =
                patientService.addInsurance(patientId, dto);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

}
