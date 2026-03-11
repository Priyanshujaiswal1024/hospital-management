package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.CreateInsuranceRequestDto;
import com.priyanshu.hospitalmanagement.dto.CreatePatientProfileRequestDto;
import com.priyanshu.hospitalmanagement.dto.InsuranceResponseDto;
import com.priyanshu.hospitalmanagement.dto.PatientResponseDto;
import com.priyanshu.hospitalmanagement.entity.Insurance;
import com.priyanshu.hospitalmanagement.entity.Patient;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.repository.InsuranceRepository;
import com.priyanshu.hospitalmanagement.repository.PatientRepository;
import com.priyanshu.hospitalmanagement.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final InsuranceRepository insuranceRepository;


    /*
     -----------------------------------------
     Create Patient Profile
     -----------------------------------------
     */
    @Transactional
    public PatientResponseDto createPatientProfile(CreatePatientProfileRequestDto dto) {
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String username = authentication.getName();

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("User not found"));
        if(patientRepository.findByUserId(user.getId()).isPresent()){
            throw new RuntimeException("Patient profile already exists");
        }


        Patient patient = new Patient();

        patient.setName(dto.getName());
        patient.setFatherName(dto.getFatherName());
        patient.setBirthDate(dto.getBirthDate());
        patient.setEmail(dto.getEmail());
        patient.setPhone(dto.getPhone());
        patient.setGender(dto.getGender());

        patient.setAddress(dto.getAddress());
        patient.setCity(dto.getCity());
        patient.setState(dto.getState());
        patient.setPincode(dto.getPincode());

        patient.setEmergencyContactName(dto.getEmergencyContactName());
        patient.setEmergencyContactPhone(dto.getEmergencyContactPhone());

        patient.setBloodGroup(dto.getBloodGroup());

        patient.setHeight(dto.getHeight());
        patient.setWeight(dto.getWeight());
        patient.setUser(user);
        patientRepository.save(patient);

        return modelMapper.map(patient, PatientResponseDto.class);
    }


    /*
     -----------------------------------------
     Get Patient By ID
     -----------------------------------------
     */
    public PatientResponseDto getPatientByUserId(Long userId) {

        Patient patient = patientRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Patient profile not found for this user"));

        return modelMapper.map(patient, PatientResponseDto.class);
    }

    /*
     -----------------------------------------
     Get All Patients (Pagination)
     -----------------------------------------
     */
    public List<PatientResponseDto> getAllPatients(Integer pageNumber, Integer pageSize) {

        return patientRepository.findAllPatients(PageRequest.of(pageNumber, pageSize))
                .stream()
                .map(patient -> modelMapper.map(patient, PatientResponseDto.class))
                .collect(Collectors.toList());
    }


    /*
     -----------------------------------------
     Update Patient Profile
     -----------------------------------------
     */
    @Transactional
    public PatientResponseDto updatePatientProfile(Long patientId,
                                                   CreatePatientProfileRequestDto dto) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Patient not found with id: " + patientId));

        patient.setPhone(dto.getPhone());
        patient.setAddress(dto.getAddress());
        patient.setCity(dto.getCity());
        patient.setState(dto.getState());
        patient.setPincode(dto.getPincode());

        patient.setEmergencyContactName(dto.getEmergencyContactName());
        patient.setEmergencyContactPhone(dto.getEmergencyContactPhone());

        patient.setHeight(dto.getHeight());
        patient.setWeight(dto.getWeight());

        patientRepository.save(patient);

        return modelMapper.map(patient, PatientResponseDto.class);
    }


    /*
     -----------------------------------------
     Add Insurance
     -----------------------------------------
     */
    @Transactional
    public InsuranceResponseDto addInsurance(Long patientId,
                                             CreateInsuranceRequestDto dto) {

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() ->
                        new EntityNotFoundException("Patient not found"));
        if(insuranceRepository.existsByPolicyNumber(dto.getPolicyNumber())){
            throw new RuntimeException("Insurance policy already exists");
        }
        Insurance insurance = new Insurance();

        insurance.setProvider(dto.getProvider());
        insurance.setPolicyNumber(dto.getPolicyNumber());
        insurance.setValidUntil(dto.getValidUntil());
        insuranceRepository.save(insurance);
        patient.setInsurance(insurance);

        patientRepository.save(patient);

        return modelMapper.map(insurance, InsuranceResponseDto.class);
    }

}