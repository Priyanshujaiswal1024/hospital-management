package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.DoctorAvailabilityRequestDto;
import com.priyanshu.hospitalmanagement.dto.DoctorResponseDto;
import com.priyanshu.hospitalmanagement.dto.OnboardDoctorRequestDto;
import com.priyanshu.hospitalmanagement.entity.Doctor;
import com.priyanshu.hospitalmanagement.entity.DoctorAvailability;
import com.priyanshu.hospitalmanagement.entity.User;
import com.priyanshu.hospitalmanagement.entity.type.RoleType;
import com.priyanshu.hospitalmanagement.repository.DoctorAvailabilityRepository;
import com.priyanshu.hospitalmanagement.repository.DoctorRepository;
import com.priyanshu.hospitalmanagement.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final DoctorAvailabilityRepository doctorAvailabilityRepository;

    public List<DoctorResponseDto> getAllDoctors() {
        return doctorRepository.findAll()
                .stream()
                .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorResponseDto onBoardNewDoctor(OnboardDoctorRequestDto onBoardDoctorRequestDto) {
        User user = userRepository.findById(onBoardDoctorRequestDto.getUserId())
                .orElseThrow(() -> new RuntimeException(
                        "User not found with id: " + onBoardDoctorRequestDto.getUserId()));

        if (doctorRepository.existsById(onBoardDoctorRequestDto.getUserId())) {
            throw new IllegalArgumentException("User is already a doctor");
        }

        Doctor doctor = Doctor.builder()
                .name(onBoardDoctorRequestDto.getName())
                .specialization(onBoardDoctorRequestDto.getSpecialization())
                .email(onBoardDoctorRequestDto.getEmail())
                .user(user)
                .build();

        user.getRoles().add(RoleType.DOCTOR);

        Doctor savedDoctor = doctorRepository.save(doctor);
        log.info("New doctor onboarded with id: {}", savedDoctor.getId());

        return modelMapper.map(savedDoctor, DoctorResponseDto.class);
    }

    // search by name only
    public List<DoctorResponseDto> searchDoctorsByName(String name) {
        List<Doctor> doctors = doctorRepository
                .findByNameContainingIgnoreCase(name);

        if (doctors.isEmpty()) {
            throw new RuntimeException("No doctors found with name: " + name);
        }

        return doctors.stream()
                .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                .collect(Collectors.toList());
    }

    // search by specialization only
    public List<DoctorResponseDto> getDoctorsBySpecialization(String specialization) {
        List<Doctor> doctors = doctorRepository
                .findBySpecializationIgnoreCase(specialization);

        if (doctors.isEmpty()) {
            throw new RuntimeException(
                    "No doctors found with specialization: " + specialization);
        }

        return doctors.stream()
                .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                .collect(Collectors.toList());
    }

    // search by both name AND specialization
    public List<DoctorResponseDto> searchDoctorsByNameAndSpecialization(
            String name, String specialization) {

        // both provided
        if (name != null && specialization != null) {
            List<Doctor> doctors = doctorRepository
                    .findByNameContainingIgnoreCaseAndSpecializationIgnoreCase(
                            name, specialization);

            if (doctors.isEmpty()) {
                throw new RuntimeException(
                        "No doctors found with name: " + name +
                                " and specialization: " + specialization);
            }

            return doctors.stream()
                    .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                    .collect(Collectors.toList());
        }

        // only name provided
        if (name != null) {
            return searchDoctorsByName(name);
        }

        // only specialization provided
        if (specialization != null) {
            return getDoctorsBySpecialization(specialization);
        }

        // nothing provided — return all
        return getAllDoctors();
    }
    @Transactional
    public void addDoctorAvailability(DoctorAvailabilityRequestDto dto) {

        Doctor doctor = doctorRepository.findById(dto.getDoctorId())
                .orElseThrow(() -> new RuntimeException("Doctor not found"));

        DoctorAvailability availability = DoctorAvailability.builder()
                .date(dto.getDate())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .doctor(doctor)
                .build();

        doctorAvailabilityRepository.save(availability);
    }
}