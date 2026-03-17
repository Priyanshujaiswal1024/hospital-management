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
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InsuranceService {

    private final InsuranceRepository insuranceRepository;
    private final PatientRepository patientRepository;
    private final UserRepository userRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // GET MY INSURANCE (logged-in patient)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public InsuranceResponseDto getMyInsurance() {

        String username = SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getName();

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
    // ASSIGN OR UPDATE INSURANCE FOR PATIENT (Admin use)
    // FIX: fetch existing insurance if present → UPDATE instead of INSERT
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public InsuranceResponseDto assignInsuranceToPatient(
            Long patientId, Insurance request) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Patient not found: " + patientId));

        // FIX: reuse existing row if one already exists for this patient
        Insurance insurance = insuranceRepository
                .findByPatient_Id(patientId)
                .orElse(new Insurance());   // UPDATE if found, INSERT if not

        insurance.setPatient(patient);
        insurance.setProvider(request.getProvider());
        insurance.setPolicyNumber(request.getPolicyNumber());
        insurance.setValidUntil(request.getValidUntil());

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
        dto.setPatientId(
                i.getPatient() != null ? i.getPatient().getId() : null);
        return dto;
    }
}