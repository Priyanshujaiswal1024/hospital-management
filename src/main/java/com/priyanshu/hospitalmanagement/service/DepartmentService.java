package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.CreateDepartmentRequestDto;
import com.priyanshu.hospitalmanagement.entity.Department;
import com.priyanshu.hospitalmanagement.entity.Doctor;
import com.priyanshu.hospitalmanagement.repository.DepartmentRepository;
import com.priyanshu.hospitalmanagement.repository.DoctorRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
private  final DoctorRepository doctorRepository;
    public Department createDepartment(CreateDepartmentRequestDto dto) {

        Department department = new Department();
        department.setName(dto.getName());
        if (dto.getHeadDoctorId() != null) {
            Doctor headDoctor = doctorRepository.findById(dto.getHeadDoctorId())
                    .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));
            department.setHeadDoctor(headDoctor);
        }
        return departmentRepository.save(department);
    }
    public Department addDoctorToDepartment(Long departmentId, Long doctorId) {

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException("Department not found"));

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));

        department.getDoctors().add(doctor);
        // Add this check in service before saving
        if (department.getDoctors().contains(doctor)) {
            throw new IllegalStateException("Doctor already exists in this department");
        }
        return departmentRepository.save(department);
    }
    public List<Department> getAllDepartments() {
        return departmentRepository.findAll();
    }
}