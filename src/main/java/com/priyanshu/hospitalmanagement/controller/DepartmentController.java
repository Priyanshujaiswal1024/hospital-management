package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.AddDoctorToDepartmentDto;
import com.priyanshu.hospitalmanagement.dto.CreateDepartmentRequestDto;
import com.priyanshu.hospitalmanagement.dto.DepartmentResponseDto;
import com.priyanshu.hospitalmanagement.dto.DoctorResponseDto;
import com.priyanshu.hospitalmanagement.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/departments")
@RequiredArgsConstructor
@Secured("ROLE_ADMIN")
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DepartmentResponseDto createDepartment(
            @RequestBody CreateDepartmentRequestDto dto) {
        return departmentService.createDepartment(dto);
    }

    @PostMapping("/add-doctor")
    public DepartmentResponseDto addDoctorToDepartment(
            @RequestBody AddDoctorToDepartmentDto dto) {
        return departmentService.addDoctorToDepartment(
                dto.getDepartmentId(), dto.getDoctorId());
    }

    @PatchMapping("/{departmentId}/head-doctor/{doctorId}")
    public DepartmentResponseDto assignHeadDoctor(
            @PathVariable Long departmentId,
            @PathVariable Long doctorId) {
        return departmentService.assignHeadDoctor(departmentId, doctorId);
    }

    @GetMapping
    public List<DepartmentResponseDto> getAllDepartments() {
        return departmentService.getAllDepartments();
    }

    @GetMapping("/{id}/doctors")
    public List<DoctorResponseDto> getDoctorsByDepartment(@PathVariable Long id) {
        return departmentService.getDoctorsByDepartment(id);
    }
}