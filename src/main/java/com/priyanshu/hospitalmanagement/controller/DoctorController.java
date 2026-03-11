package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.AppointmentResponseDto;
import com.priyanshu.hospitalmanagement.dto.CreatePrescriptionRequestDto;
import com.priyanshu.hospitalmanagement.dto.DoctorAvailabilityRequestDto;
import com.priyanshu.hospitalmanagement.entity.UserPrincipal;
import com.priyanshu.hospitalmanagement.service.AppointmentService;
import com.priyanshu.hospitalmanagement.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final AppointmentService appointmentService;
    private  final DoctorService doctorService;

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getAllAppointmentsOfDoctor() {
        UserPrincipal userPrincipal = (UserPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(
                appointmentService.getAllAppointmentsOfDoctor(userPrincipal.getId()));
    }

    @PatchMapping("/appointments/{appointmentId}/reassign")
    public ResponseEntity<AppointmentResponseDto> reAssignAppointment(
            @PathVariable Long appointmentId,
            @RequestParam Long doctorId) {
        return ResponseEntity.ok(
                appointmentService.reAssignAppointmentToAnotherDoctor(
                        appointmentId, doctorId));
    }
    @PostMapping("/doctor/availability")
    public ResponseEntity<String> addDoctorAvailability(
            @RequestBody DoctorAvailabilityRequestDto dto) {

        doctorService.addDoctorAvailability(dto);

        return ResponseEntity.ok("Doctor availability added successfully");
    }
    @PostMapping("/appointments/{appointmentId}/prescription")
    public void addPrescription(
            @PathVariable Long appointmentId,
            @RequestBody CreatePrescriptionRequestDto dto) {

        appointmentService.addPrescription(appointmentId, dto);
    }
}
//```
//
//        ---
//
//        ## Postman Test Order:
//        ```
//        1. POST /api/v1/auth/signup       → create patient
//2. POST /api/v1/auth/login        → get JWT token
//3. POST /api/v1/patients/appointments  → book appointment (with Bearer token)
//4. GET  /api/v1/patients/appointments  → view appointments
//5. GET  /api/v1/patients/profile       → view profile