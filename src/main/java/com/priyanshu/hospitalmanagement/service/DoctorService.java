package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.DoctorAvailabilityRequestDto;
import com.priyanshu.hospitalmanagement.dto.DoctorResponseDto;
import com.priyanshu.hospitalmanagement.dto.OnboardDoctorRequestDto;
import com.priyanshu.hospitalmanagement.entity.*;
import com.priyanshu.hospitalmanagement.entity.type.RoleType;
import com.priyanshu.hospitalmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final UserRepository userRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final DepartmentRepository departmentRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    // ─────────────────────────────────────────────────────────────────────────
    // GET ALL DOCTORS (paginated)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<DoctorResponseDto> getAllDoctors(int page, int size) {
        return doctorRepository
                .findAll(PageRequest.of(page, size))
                .map(this::mapToDto);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ONBOARD NEW DOCTOR (Admin only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public DoctorResponseDto onBoardNewDoctor(OnboardDoctorRequestDto dto) {

        // 1. Check email not already taken
        if (userRepository.existsByUsername(dto.getEmail())) {
            throw new RuntimeException("Email already registered: " + dto.getEmail());
        }

        // 2. Create User account (email == username per your requirement)
        User user = User.builder()
                .username(dto.getEmail())
                .password(passwordEncoder.encode(dto.getPassword()))
                .build();
        user.getRoles().add(RoleType.DOCTOR);
        userRepository.save(user);

        // 3. Build Doctor entity
        Doctor doctor = Doctor.builder()
                .user(user)
                .name(dto.getName())
                .email(dto.getEmail())
                .specialization(dto.getSpecialization())
                .consultationFee(dto.getConsultationFee())
                .experienceYears(dto.getExperienceYears())
                .phoneNumber(dto.getPhoneNumber())
                .bio(dto.getBio())
                .profileImageUrl(dto.getProfileImageUrl())
                .build();

        // 4. Assign department if provided
        if (dto.getDepartmentId() != null) {
            Department department = departmentRepository.findById(dto.getDepartmentId())
                    .orElseThrow(() -> new RuntimeException(
                            "Department not found: " + dto.getDepartmentId()));
            department.getDoctors().add(doctor);
            doctor.getDepartments().add(department);
        }

        Doctor saved = doctorRepository.save(doctor);
        log.info("New doctor onboarded: {} (id={})", saved.getName(), saved.getId());

        // 5. Send welcome email to doctor
        emailService.sendDoctorWelcome(
                saved.getEmail(),
                saved.getName(),
                dto.getPassword()   // send plain password once — they should change it
        );

        return mapToDto(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEARCH DOCTORS
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public Page<DoctorResponseDto> searchDoctors(
            String name, String specialization, int page, int size) {

        Pageable pageable = PageRequest.of(page, size);

        if (name != null && specialization != null) {
            return doctorRepository
                    .findByNameContainingIgnoreCaseAndSpecializationIgnoreCase(
                            name, specialization, pageable)
                    .map(this::mapToDto);
        }
        if (name != null) {
            return doctorRepository
                    .findByNameContainingIgnoreCase(name, pageable)
                    .map(this::mapToDto);
        }
        if (specialization != null) {
            return doctorRepository
                    .findBySpecializationIgnoreCase(specialization, pageable)
                    .map(this::mapToDto);
        }
        return doctorRepository.findAll(pageable).map(this::mapToDto);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADD DOCTOR AVAILABILITY
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void addDoctorAvailability(Long doctorId, DoctorAvailabilityRequestDto dto) {

        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));

        // Guard: prevent duplicate availability slot for same date
        boolean slotExists = doctorAvailabilityRepository
                .existsByDoctorIdAndDate(doctorId, dto.getDate());
        if (slotExists) {
            throw new RuntimeException(
                    "Availability already set for this date: " + dto.getDate());
        }

        DoctorAvailability availability = DoctorAvailability.builder()
                .doctor(doctor)         // ← set only once (was set twice before)
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .build();

        doctorAvailabilityRepository.save(availability);
        log.info("Availability added for doctor {} on {}", doctorId, dto.getDate());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER — manual mapping avoids ModelMapper lazy-load issues
    // ─────────────────────────────────────────────────────────────────────────
    private DoctorResponseDto mapToDto(Doctor d) {
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
                        .collect(Collectors.toSet())
        );
        return dto;
    }
}