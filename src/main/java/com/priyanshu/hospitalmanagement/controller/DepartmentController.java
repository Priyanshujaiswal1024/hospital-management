package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.AddDoctorToDepartmentDto;
import com.priyanshu.hospitalmanagement.dto.CreateDepartmentRequestDto;
import com.priyanshu.hospitalmanagement.entity.Department;
import com.priyanshu.hospitalmanagement.service.DepartmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentService departmentService;

    @PostMapping
    public ResponseEntity<Department> createDepartment(
            @RequestBody CreateDepartmentRequestDto dto) {

        return ResponseEntity.ok(departmentService.createDepartment(dto));
    }
    @PostMapping("/add-doctortoDepartment")
    public ResponseEntity<Department> addDoctorToDepartment(
            @RequestBody AddDoctorToDepartmentDto dto) {

        Department department = departmentService.addDoctorToDepartment(
                dto.getDepartmentId(),
                dto.getDoctorId()
        );

        return ResponseEntity.ok(department);
    }
    @GetMapping
    public ResponseEntity<List<Department>> getAllDepartments() {
        return ResponseEntity.ok(departmentService.getAllDepartments());
    }
}