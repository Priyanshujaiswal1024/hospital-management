package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.AvailableSlotDto;
import com.priyanshu.hospitalmanagement.service.DoctorAvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/public/doctors")
public class DoctorAvailabilityController {

    private final DoctorAvailabilityService doctorAvailabilityService;

    @GetMapping("/{doctorId}/slots")
//    @PreAuthorize("hasAnyRole('PATIENT','DOCTOR','ADMIN')")
    public List<AvailableSlotDto> getSlots(
            @PathVariable Long doctorId,
            @RequestParam LocalDate date) {

        return doctorAvailabilityService.getAvailableSlots(doctorId, date);
    }
}