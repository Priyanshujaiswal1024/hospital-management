package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.CreateDepartmentRequestDto;
import com.priyanshu.hospitalmanagement.dto.DepartmentResponseDto;
import com.priyanshu.hospitalmanagement.dto.DoctorResponseDto;
import com.priyanshu.hospitalmanagement.entity.Department;
import com.priyanshu.hospitalmanagement.entity.Doctor;
import com.priyanshu.hospitalmanagement.repository.DepartmentRepository;
import com.priyanshu.hospitalmanagement.repository.DoctorRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DoctorRepository doctorRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE DEPARTMENT
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public DepartmentResponseDto createDepartment(CreateDepartmentRequestDto dto) {

        // Guard: prevent duplicate department names
        if (departmentRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new IllegalArgumentException(
                    "Department already exists: " + dto.getName());
        }

        Department department = new Department();
        department.setName(dto.getName());

        if (dto.getHeadDoctorId() != null) {
            Doctor headDoctor = doctorRepository.findById(dto.getHeadDoctorId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Doctor not found: " + dto.getHeadDoctorId()));
            department.setHeadDoctor(headDoctor);
        }

        return mapToDto(departmentRepository.save(department));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADD DOCTOR TO DEPARTMENT
    // FIX: check BEFORE adding, not after
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public DepartmentResponseDto addDoctorToDepartment(Long departmentId, Long doctorId) {

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Department not found: " + departmentId));

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Doctor not found: " + doctorId));

        // FIX: check BEFORE adding (original code checked after — never triggered)
        if (department.getDoctors().contains(doctor)) {
            throw new IllegalStateException(
                    "Doctor already exists in this department");
        }

        department.getDoctors().add(doctor);
        doctor.getDepartments().add(department); // keep both sides of ManyToMany in sync

        return mapToDto(departmentRepository.save(department));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASSIGN HEAD DOCTOR
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public DepartmentResponseDto assignHeadDoctor(Long departmentId, Long doctorId) {

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Department not found: " + departmentId));

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Doctor not found: " + doctorId));

        // Head doctor should also be a member of the department
        if (!department.getDoctors().contains(doctor)) {
            department.getDoctors().add(doctor);
            doctor.getDepartments().add(department);
        }

        department.setHeadDoctor(doctor);
        return mapToDto(departmentRepository.save(department));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ALL DEPARTMENTS
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DepartmentResponseDto> getAllDepartments() {
        return departmentRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET DOCTORS BY DEPARTMENT
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<DoctorResponseDto> getDoctorsByDepartment(Long departmentId) {

        Department department = departmentRepository.findById(departmentId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Department not found: " + departmentId));

        return doctorRepository.findByDepartments(department)
                .stream()
                .map(this::mapToDoctorDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private DepartmentResponseDto mapToDto(Department d) {
        DepartmentResponseDto dto = new DepartmentResponseDto();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setHeadDoctorName(
                d.getHeadDoctor() != null ? d.getHeadDoctor().getName() : "—");
        dto.setDoctorNames(
                d.getDoctors().stream()
                        .map(Doctor::getName)
                        .collect(Collectors.toSet()));
        return dto;
    }

    private DoctorResponseDto mapToDoctorDto(Doctor d) {
        DoctorResponseDto dto = new DoctorResponseDto();
        dto.setId(d.getId());
        dto.setName(d.getName());
        dto.setEmail(d.getEmail());
        dto.setSpecialization(d.getSpecialization());
        dto.setConsultationFee(d.getConsultationFee());
        dto.setExperienceYears(d.getExperienceYears());
        dto.setPhoneNumber(d.getPhoneNumber());
        dto.setBio(d.getBio());
        dto.setProfileImageUrl(d.getProfileImageUrl());
        dto.setDepartments(
                d.getDepartments().stream()
                        .map(Department::getName)
                        .collect(Collectors.toSet()));
        return dto;
    }
}