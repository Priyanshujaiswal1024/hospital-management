package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.DepartmentResponseDto;
import com.priyanshu.hospitalmanagement.dto.DoctorResponseDto;
import com.priyanshu.hospitalmanagement.service.DepartmentService;
import com.priyanshu.hospitalmanagement.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class HospitalController {

    private final DoctorService doctorService;
    private final DepartmentService departmentService;

    // Single unified search endpoint — replaces 3 redundant ones
    // GET /public/doctors?page=0&size=10
    // GET /public/doctors?name=sharma
    // GET /public/doctors?specialization=cardiology
    // GET /public/doctors?name=sharma&specialization=cardiology
    @GetMapping("/doctors")
    public Page<DoctorResponseDto> searchDoctors(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String specialization,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return doctorService.searchDoctors(name, specialization, page, size);
    }

    // GET /public/departments
    @GetMapping("/departments")
    public List<DepartmentResponseDto> getAllDepartments() {
        return departmentService.getAllDepartments();
    }

    // GET /public/departments/{id}/doctors
    // FIX: was /public/public/departments/{id}/doctors before
    @GetMapping("/departments/{id}/doctors")
    public List<DoctorResponseDto> getDoctorsByDepartment(@PathVariable Long id) {
        return departmentService.getDoctorsByDepartment(id);
    }
}