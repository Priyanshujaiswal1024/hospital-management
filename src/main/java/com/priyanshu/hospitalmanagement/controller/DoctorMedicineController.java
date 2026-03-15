package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.MedicineResponseDto;
import com.priyanshu.hospitalmanagement.service.MedicineService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors/medicines")
@RequiredArgsConstructor
public class DoctorMedicineController {

    private final MedicineService medicineService;

    @GetMapping
    public List<MedicineResponseDto> getMedicines() {
        return medicineService.getAllMedicines();
    }
}