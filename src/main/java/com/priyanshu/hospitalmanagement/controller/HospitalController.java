package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.DoctorResponseDto;
import com.priyanshu.hospitalmanagement.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class HospitalController {

    private final DoctorService doctorService;

    // 1. Get all doctors
    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponseDto>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }

    // 2. Search by name only
    // GET /public/doctors/search?name=smith
    @GetMapping("/doctors/search")
    public ResponseEntity<List<DoctorResponseDto>> searchDoctorsByName(
            @RequestParam String name) {
        return ResponseEntity.ok(doctorService.searchDoctorsByName(name));
    }

    // 3. Filter by specialization only
    // GET /public/doctors/specialization?specialization=cardiology
    @GetMapping("/doctors/specialization")
    public ResponseEntity<List<DoctorResponseDto>> getDoctorsBySpecialization(
            @RequestParam String specialization) {
        return ResponseEntity.ok(
                doctorService.getDoctorsBySpecialization(specialization));
    }

    // 4. Search by both name AND specialization
    // GET /public/doctors/filter?name=smith&specialization=cardiology
    @GetMapping("/doctors/filter")
    public ResponseEntity<List<DoctorResponseDto>> searchDoctorsByNameAndSpecialization(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String specialization) {

        // if both params sent
        if (name != null && specialization != null) {
            return ResponseEntity.ok(
                    doctorService.searchDoctorsByNameAndSpecialization(
                            name, specialization));
        }

        // if only name sent
        if (name != null) {
            return ResponseEntity.ok(
                    doctorService.searchDoctorsByName(name));
        }

        // if only specialization sent
        if (specialization != null) {
            return ResponseEntity.ok(
                    doctorService.getDoctorsBySpecialization(specialization));
        }

        // if nothing sent — return all
        return ResponseEntity.ok(doctorService.getAllDoctors());
    }
}