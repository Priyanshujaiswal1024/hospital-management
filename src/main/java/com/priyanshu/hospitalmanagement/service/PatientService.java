package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.entity.Insurance;
import com.priyanshu.hospitalmanagement.entity.Patient;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.entity.type.BloodGroupType;
import com.priyanshu.hospitalmanagement.repository.InsuranceRepository;
import com.priyanshu.hospitalmanagement.repository.PatientRepository;
import com.priyanshu.hospitalmanagement.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final InsuranceRepository insuranceRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE PATIENT PROFILE
    // Called after signup + OTP verification
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public PatientResponseDto createPatientProfile(
            CreatePatientProfileRequestDto dto) {

        // Get logged-in user from security context
        String username = getLoggedInUsername();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException(
                        "User not found: " + username));

        // FIX: use findById(user.getId()) — Patient ID == User ID via @MapsId
        if (patientRepository.existsById(user.getId())) {
            throw new RuntimeException("Patient profile already exists");
        }

        Patient patient = Patient.builder()
                .user(user)                                    // @MapsId uses user.getId()
                .name(dto.getName())
                .fatherName(dto.getFatherName())
                .birthDate(dto.getBirthDate())
                // FIX: removed setEmail() and setPhone()
                // email → user.getUsername()
                // phone → user.getPhone()
                .gender(dto.getGender())
                .address(dto.getAddress())
                .city(dto.getCity())
                .state(dto.getState())
                .pincode(dto.getPincode())
                .emergencyContactName(dto.getEmergencyContactName())
                .emergencyContactPhone(dto.getEmergencyContactPhone())
                .bloodGroup(dto.getBloodGroup())
                .height(dto.getHeight())
                .weight(dto.getWeight())
                .build();

        return mapToDto(patientRepository.save(patient));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET PATIENT PROFILE (logged-in patient)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PatientResponseDto getMyProfile() {

        String username = getLoggedInUsername();

        Patient patient = patientRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient profile not found"));

        return mapToDto(patient);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET PATIENT BY USER ID (Admin use)
    // FIX: was findByUserId() — now findById() works because @MapsId
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public PatientResponseDto getPatientByUserId(Long userId) {

        Patient patient = patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found for userId: " + userId));

        return mapToDto(patient);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ALL PATIENTS (Admin — paginated)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PatientResponseDto> getAllPatients(int page, int size) {

        return patientRepository
                .findAll(PageRequest.of(page, size))
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE PATIENT PROFILE
    // FIX: consolidated updatePatientProfile + updateProfile into one method
    // FIX: removed setPhone() — phone lives on User, update via user.setPhone()
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public PatientResponseDto updatePatientProfile(UpdatePatientProfileRequestDto dto) {

        String username = getLoggedInUsername();

        Patient patient = patientRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found: " + username));

        // Update phone on User entity (not Patient — field removed from Patient)
        if (dto.getPhone() != null) {
            patient.getUser().setPhone(dto.getPhone());
            userRepository.save(patient.getUser());
        }
        if (dto.getName() != null)        patient.setName(dto.getName());
        if (dto.getFatherName() != null)  patient.setFatherName(dto.getFatherName());
        if (dto.getGender() != null)      patient.setGender(dto.getGender());
        if (dto.getBirthDate() != null)   patient.setBirthDate(dto.getBirthDate());
        if (dto.getBloodGroup() != null)  patient.setBloodGroup(dto.getBloodGroup());
        if (dto.getAddress() != null) {
            patient.setAddress(dto.getAddress());
        }
        if (dto.getCity() != null) {
            patient.setCity(dto.getCity());
        }
        if (dto.getState() != null) {
            patient.setState(dto.getState());
        }
        if (dto.getPincode() != null) {
            patient.setPincode(dto.getPincode());
        }
        if (dto.getEmergencyContactName() != null) {
            patient.setEmergencyContactName(dto.getEmergencyContactName());
        }
        if (dto.getEmergencyContactPhone() != null) {
            patient.setEmergencyContactPhone(dto.getEmergencyContactPhone());
        }
        if (dto.getHeight() != null) {
            patient.setHeight(dto.getHeight());
        }
        if (dto.getWeight() != null) {
            patient.setWeight(dto.getWeight());
        }

        return mapToDto(patientRepository.save(patient));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADD INSURANCE
    // FIX: was findByUser_Id() — now findById() via @MapsId
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public InsuranceResponseDto addInsurance(Long userId,
                                             CreateInsuranceRequestDto dto) {

        // FIX: Patient ID == User ID via @MapsId
        Patient patient = patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found for userId: " + userId));

        if (insuranceRepository.existsByPolicyNumber(dto.getPolicyNumber())) {
            throw new RuntimeException(
                    "Insurance policy already exists: " + dto.getPolicyNumber());
        }

        Insurance insurance = Insurance.builder()
                .provider(dto.getProvider())
                .policyNumber(dto.getPolicyNumber())
                .validUntil(dto.getValidUntil())
                .patient(patient)
                .build();

        return mapToInsuranceDto(insuranceRepository.save(insurance));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET INSURANCE
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public InsuranceResponseDto getInsurance(Long userId) {

        Patient patient = patientRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found"));

        Insurance insurance = patient.getInsurance();
        if (insurance == null) {
            throw new EntityNotFoundException("No insurance found for this patient");
        }

        return mapToInsuranceDto(insurance);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private String getLoggedInUsername() {
        return SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();
    }

    private PatientResponseDto mapToDto(Patient p) {
        PatientResponseDto dto = new PatientResponseDto();
        dto.setId(p.getId());
        dto.setName(p.getName());
        dto.setFatherName(p.getFatherName());
        dto.setBirthDate(p.getBirthDate());
        dto.setGender(p.getGender());
        dto.setAddress(p.getAddress());
        dto.setCity(p.getCity());
        dto.setState(p.getState());
        dto.setPincode(p.getPincode());
        dto.setEmergencyContactName(p.getEmergencyContactName());
        dto.setEmergencyContactPhone(p.getEmergencyContactPhone());
        dto.setBloodGroup(p.getBloodGroup());
        dto.setHeight(p.getHeight());
        dto.setWeight(p.getWeight());
        dto.setCreatedAt(p.getCreatedAt());
        // Get email and phone from User — not Patient
        dto.setEmail(p.getUser().getUsername());
        dto.setPhone(p.getUser().getPhone());
        return dto;
    }

    private InsuranceResponseDto mapToInsuranceDto(Insurance i) {
        InsuranceResponseDto dto = new InsuranceResponseDto();
        dto.setId(i.getId());
        dto.setProvider(i.getProvider());
        dto.setPolicyNumber(i.getPolicyNumber());
        dto.setValidUntil(i.getValidUntil());
        dto.setCreatedAt(i.getCreatedAt());
        dto.setPatientId(i.getPatient() != null ? i.getPatient().getId() : null); // ← now works
        return dto;
    }
}