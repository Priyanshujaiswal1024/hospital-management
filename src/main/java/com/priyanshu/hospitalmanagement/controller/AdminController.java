package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.service.AdminService;
import com.priyanshu.hospitalmanagement.service.AppointmentService;
import com.priyanshu.hospitalmanagement.service.BillService;
import com.priyanshu.hospitalmanagement.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final DepartmentService departmentService;
    private final BillService billService;
    private final AppointmentService appointmentService;
    @GetMapping("/patients")
    public ResponseEntity<List<PatientResponseDto>> getAllPatients(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(adminService.getAllPatients(page, size));
    }

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getAllAppointments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(appointmentService.getAllAppointments(page, size));
    }

    @GetMapping("/bills")
    public ResponseEntity<List<BillResponseDto>> getAllBills(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {
        return ResponseEntity.ok(billService.getAllBills(page, size));
    }

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponseDto>> getAllDoctors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(adminService.getAllDoctors(page, size));
    }
    // GET Admin Profile (logged-in admin)
    @GetMapping("/profile")
    public ResponseEntity<AdminProfileDto> getMyProfile() {
        String username = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return ResponseEntity.ok(adminService.getAdminProfile(username));
    }

    // GET All Admins
    @GetMapping("/all")
    public ResponseEntity<List<AdminProfileDto>> getAllAdmins() {
        return ResponseEntity.ok(adminService.getAllAdmins());
    }
    // CREATE DOCTOR
    @PostMapping("/doctors")
    public ResponseEntity<DoctorResponseDto> createDoctor(
            @RequestBody CreateDoctorRequestDto dto) {

        return ResponseEntity.ok(adminService.createDoctor(dto));
    }

    // UPDATE DOCTOR
    @PutMapping("/doctors/{doctorId}")
    public ResponseEntity<DoctorResponseDto> updateDoctor(
            @PathVariable Long doctorId,
            @RequestBody CreateDoctorRequestDto dto) {

        return ResponseEntity.ok(adminService.updateDoctor(doctorId, dto));
    }

    // DELETE DOCTOR
    @DeleteMapping("/doctors/{doctorId}")
    public ResponseEntity<Void> deleteDoctor(@PathVariable Long doctorId) {

        adminService.deleteDoctor(doctorId);
        return ResponseEntity.noContent().build();
    }
    @PostMapping("/create-admin")
    public ResponseEntity<User> createAdmin(
            @RequestBody CreateAdminRequestDto dto){

        return ResponseEntity.ok(adminService.createAdmin(dto));
    }
    @PutMapping("/departments/{departmentId}/head-doctor/{doctorId}")
    public ResponseEntity<String> assignHeadDoctor(
            @PathVariable Long departmentId,
            @PathVariable Long doctorId) {

        departmentService.assignHeadDoctor(departmentId, doctorId);
        return ResponseEntity.ok("Head doctor assigned successfully");
    }
    }
