package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.CreateAdminRequestDto;
import com.priyanshu.hospitalmanagement.dto.CreateDoctorRequestDto;
import com.priyanshu.hospitalmanagement.dto.DashboardResponseDto;
import com.priyanshu.hospitalmanagement.dto.DoctorResponseDto;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.service.AdminService;
import com.priyanshu.hospitalmanagement.service.BillService;
import com.priyanshu.hospitalmanagement.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final DepartmentService departmentService;

    // GET ALL PATIENTS
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponseDto>> getAllDoctors(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        return ResponseEntity.ok(adminService.getAllDoctors(page, size));
    }
    // GET ALL DOCTORS
//    @GetMapping("/doctors")
//    public ResponseEntity<List<DoctorResponseDto>> getAllDoctors() {
//        return ResponseEntity.ok(adminService.getAllDoctors());
//    }

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
