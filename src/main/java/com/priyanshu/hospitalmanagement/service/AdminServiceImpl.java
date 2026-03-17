package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.entity.Patient;
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
import java.util.stream.Collectors;

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
    private final EmailService emailService;

    // GET ALL PATIENTS
    @Override
    public List<PatientResponseDto> getAllPatients(Integer page, Integer size) {
        return patientRepository
                .findAll(PageRequest.of(page, size))
                .stream()
                .map(this::mapPatientToDto) // ✅
                .toList();
    }

    // GET ALL DOCTORS
    @Override
    public List<DoctorResponseDto> getAllDoctors(int page, int size) {

        return doctorRepository
                .findAll(PageRequest.of(page, size))
                .stream()
                .map(this::mapToDto)
                .toList();
    }
    // CREATE DOCTOR
    @Override
    public DoctorResponseDto createDoctor(CreateDoctorRequestDto dto) {

        // 1️⃣ Create User
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));

        Set<RoleType> roles = new HashSet<>();
        roles.add(RoleType.DOCTOR);

        user.setRoles(roles);

        userRepository.save(user);

        // 2️⃣ Find Department
        Department department = departmentRepository
                .findById(dto.getDepartmentId())
                .orElseThrow(() -> new RuntimeException("Department not found"));

        // 3️⃣ Create Doctor
        Doctor doctor = new Doctor();

        doctor.setUser(user);
        doctor.setName(dto.getName());
        doctor.setEmail(dto.getEmail());
        doctor.setSpecialization(dto.getSpecialization());
        doctor.setConsultationFee(dto.getConsultationFee());
        doctor.setExperienceYears(dto.getExperienceYears());
        doctor.setPhoneNumber(dto.getPhoneNumber());
        doctor.setBio(dto.getBio());
        doctor.setProfileImageUrl(dto.getProfileImageUrl());

        doctor.getDepartments().add(department);
        department.getDoctors().add(doctor);

        doctorRepository.save(doctor);
        emailService.sendDoctorWelcome(
                dto.getEmail(),
                dto.getName(),
                dto.getPassword()
        );
        return mapToDto(doctor);
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

        return mapToDto(doctor);
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
            if (userRepository.existsByUsername(dto.getEmail())) {
                throw new RuntimeException("Email already registered: " + dto.getEmail());
            }
        User user = new User();

        user.setUsername(dto.getEmail());
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
    public AdminProfileDto getAdminProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        return mapToAdminDto(user);
    }

    public List<AdminProfileDto> getAllAdmins() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRoles().contains(RoleType.ADMIN))
                .map(this::mapToAdminDto)
                .toList();
    }

    private AdminProfileDto mapToAdminDto(User u) {
        return AdminProfileDto.builder()
                .id(u.getId())
                .email(u.getUsername())
                .fullName(u.getFullName())
                .phone(u.getPhone())
                .roles(u.getRoles().stream()
                        .map(RoleType::name)
                        .collect(Collectors.toSet()))
                .build();
    }
    // ── PRIVATE HELPER ────────────────────────────────────────────
    private DoctorResponseDto mapToDto(Doctor doctor) {
        DoctorResponseDto dto = new DoctorResponseDto();
        dto.setId(doctor.getId());
        dto.setName(doctor.getName());
        dto.setEmail(doctor.getEmail());
        dto.setSpecialization(doctor.getSpecialization());
        dto.setConsultationFee(doctor.getConsultationFee());
        dto.setExperienceYears(doctor.getExperienceYears());
        dto.setPhoneNumber(doctor.getPhoneNumber());
        dto.setBio(doctor.getBio());
        dto.setProfileImageUrl(doctor.getProfileImageUrl());

        // ✅ Extract department NAMES not objects
        dto.setDepartments(
                doctor.getDepartments()
                        .stream()
                        .map(Department::getName)   // ← this is the fix
                        .collect(java.util.stream.Collectors.toSet())
        );

        return dto;
    }
    // ✅ Private helper add karo:
    private PatientResponseDto mapPatientToDto(Patient patient) {
        PatientResponseDto dto = new PatientResponseDto();
        dto.setId(patient.getId());
        dto.setName(patient.getName());
        dto.setFatherName(patient.getFatherName());
        dto.setBirthDate(patient.getBirthDate());
        dto.setGender(patient.getGender());
        dto.setAddress(patient.getAddress());
        dto.setCity(patient.getCity());
        dto.setState(patient.getState());
        dto.setPincode(patient.getPincode());
        dto.setEmergencyContactName(patient.getEmergencyContactName());
        dto.setEmergencyContactPhone(patient.getEmergencyContactPhone());
        dto.setBloodGroup(patient.getBloodGroup());
        dto.setHeight(patient.getHeight());
        dto.setWeight(patient.getWeight());
        dto.setCreatedAt(patient.getCreatedAt());
        // ✅ Email + Phone from User
        dto.setEmail(patient.getUser().getUsername());
        dto.setPhone(patient.getUser().getPhone());
        return dto;
    }
    }
