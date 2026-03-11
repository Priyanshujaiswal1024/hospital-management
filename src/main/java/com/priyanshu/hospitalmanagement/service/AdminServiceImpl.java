package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.repository.*;
import com.priyanshu.hospitalmanagement.entity.Department;
import com.priyanshu.hospitalmanagement.entity.Doctor;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.entity.type.RoleType;

import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final ModelMapper modelMapper;
    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;

    // GET ALL PATIENTS
    @Override
    public List<PatientResponseDto> getAllPatients(Integer page, Integer size) {

        return patientRepository
                .findAll(PageRequest.of(page, size))
                .stream()
                .map(patient -> modelMapper.map(patient, PatientResponseDto.class))
                .toList();
    }

    // GET ALL DOCTORS
    @Override
    public List<DoctorResponseDto> getAllDoctors(int page, int size) {

        return doctorRepository
                .findAll(PageRequest.of(page, size))
                .stream()
                .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                .toList();
    }
    // CREATE DOCTOR
    @Override
    public DoctorResponseDto createDoctor(CreateDoctorRequestDto dto) {

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        Set<RoleType> roles = new HashSet<>();
        roles.add(RoleType.DOCTOR);

        user.setRoles(roles);

        userRepository.save(user);
        Department department = departmentRepository
                .findById(dto.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));
        Doctor doctor = new Doctor();
        doctor.setUser(user);
        doctor.setName(dto.getName());
        doctor.setEmail(dto.getEmail());
        doctor.setSpecialization(dto.getSpecialization());
            doctor.getDepartments().add(department);
        doctorRepository.save(doctor);

        return modelMapper.map(doctor, DoctorResponseDto.class);
    }

    // UPDATE DOCTOR
    @Override
    public DoctorResponseDto updateDoctor(Long doctorId, CreateDoctorRequestDto dto) {

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        doctor.setName(dto.getName());
        doctor.setEmail(dto.getEmail());
        doctor.setSpecialization(dto.getSpecialization());

        doctorRepository.save(doctor);

        return modelMapper.map(doctor, DoctorResponseDto.class);
    }

    // DELETE DOCTOR
    @Override
    public void deleteDoctor(Long doctorId) {

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        doctorRepository.delete(doctor);
    }


        @Override
        public User createAdmin(CreateAdminRequestDto dto){

        User user = new User();

        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        Set<RoleType> roles = new HashSet<>();
        roles.add(RoleType.ADMIN);

        user.setRoles(roles);

        return userRepository.save(user);
    }

    @Override
    public DashboardResponseDto getDashboard() {

        long totalDoctors = doctorRepository.count();
        long totalPatients = patientRepository.count();
        long totalAppointments = appointmentRepository.count();
        long totalDepartments = departmentRepository.count();

        LocalDate today = LocalDate.now();

        long todayAppointments =
                appointmentRepository.countByAppointmentTimeBetween(
                        today.atStartOfDay(),
                        today.plusDays(1).atStartOfDay()
                );

        return new DashboardResponseDto(
                totalDoctors,
                totalPatients,
                totalAppointments,
                todayAppointments,
                totalDepartments
        );
    }
    }
