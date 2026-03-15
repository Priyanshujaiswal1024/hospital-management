package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.InsuranceResponseDto;
import com.priyanshu.hospitalmanagement.entity.Insurance;
import com.priyanshu.hospitalmanagement.entity.Patient;
import com.priyanshu.hospitalmanagement.repository.InsuranceRepository;
import com.priyanshu.hospitalmanagement.repository.PatientRepository;
import com.priyanshu.hospitalmanagement.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; // ← Spring's, not Jakarta

@Service
@RequiredArgsConstructor
public class InsuranceService {

    private final InsuranceRepository insuranceRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // GET MY INSURANCE (logged-in patient)
    // FIX: findByUser() removed — use findByUser_Username() instead
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public InsuranceResponseDto getMyInsurance() {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

        // FIX: use findByUser_Username — findByUser() was removed
        Patient patient = patientRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found for: " + username));

        Insurance insurance = patient.getInsurance();
        if (insurance == null) {
            throw new EntityNotFoundException(
                    "No insurance found for this patient");
        }

        return mapToDto(insurance);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ASSIGN INSURANCE TO PATIENT (Admin use)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public InsuranceResponseDto assignInsuranceToPatient(
            Long patientId, Insurance insurance) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found: " + patientId));

        insurance.setPatient(patient);
        patient.setInsurance(insurance);    // keep both sides in sync

        return mapToDto(insuranceRepository.save(insurance));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // REMOVE INSURANCE FROM PATIENT (Admin use)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void removeInsuranceFromPatient(Long patientId) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found: " + patientId));

        Insurance insurance = patient.getInsurance();
        if (insurance == null) {
            throw new EntityNotFoundException(
                    "No insurance found for patient: " + patientId);
        }

        patient.setInsurance(null);
        insuranceRepository.delete(insurance);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────────────────────────────────
    private InsuranceResponseDto mapToDto(Insurance i) {
        InsuranceResponseDto dto = new InsuranceResponseDto();
        dto.setId(i.getId());
        dto.setProvider(i.getProvider());
        dto.setPolicyNumber(i.getPolicyNumber());
        dto.setValidUntil(i.getValidUntil());
        dto.setCreatedAt(i.getCreatedAt());
        dto.setPatientId(                       // ← now works, field exists in DTO
                i.getPatient() != null ? i.getPatient().getId() : null);
        return dto;
    }
}