package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.MedicineRequestDto;
import com.priyanshu.hospitalmanagement.dto.MedicineResponseDto;
import com.priyanshu.hospitalmanagement.entity.type.MedicineType;
import com.priyanshu.hospitalmanagement.service.MedicineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/medicines")
@RequiredArgsConstructor
@Secured("ROLE_ADMIN")  // all endpoints in this controller require ADMIN
public class AdminMedicineController {

    private final MedicineService medicineService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MedicineResponseDto createMedicine(@Valid @RequestBody MedicineRequestDto dto) {
        return medicineService.addMedicine(dto);
    }

    @GetMapping
    public List<MedicineResponseDto> getAllMedicines() {
        return medicineService.getAllMedicines();
    }

    @GetMapping("/{id}")
    public MedicineResponseDto getMedicineById(@PathVariable Long id) {
        return medicineService.getMedicineById(id);
    }

    @GetMapping("/low-stock")
    public List<MedicineResponseDto> getLowStockMedicines() {
        return medicineService.getLowStockMedicines();
    }

    @GetMapping("/search")
    public List<MedicineResponseDto> searchMedicines(@RequestParam String name) {
        return medicineService.searchByName(name);
    }

    @GetMapping("/type/{type}")
    public List<MedicineResponseDto> getByType(@PathVariable MedicineType type) {
        return medicineService.getByType(type);
    }

    @PutMapping("/{id}")
    public MedicineResponseDto updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody MedicineRequestDto dto) {
        return medicineService.updateMedicine(id, dto);
    }

    @PatchMapping("/{id}/restock")
    public MedicineResponseDto restockMedicine(
            @PathVariable Long id,
            @RequestParam int quantity) {
        return medicineService.restockMedicine(id, quantity);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
    }
}