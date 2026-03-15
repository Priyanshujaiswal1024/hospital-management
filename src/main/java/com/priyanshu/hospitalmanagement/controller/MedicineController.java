package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.MedicineRequestDto;
import com.priyanshu.hospitalmanagement.dto.MedicineResponseDto;
import com.priyanshu.hospitalmanagement.entity.type.MedicineType;
import com.priyanshu.hospitalmanagement.service.MedicineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medicines")
@RequiredArgsConstructor
public class MedicineController {

    private final MedicineService medicineService;

    // ── Admin: Add new medicine ─────────────────────────────────────────────
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MedicineResponseDto> addMedicine(
            @Valid @RequestBody MedicineRequestDto dto) {
        return ResponseEntity.ok(medicineService.addMedicine(dto));
    }

    // ── Admin: Update medicine ──────────────────────────────────────────────
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MedicineResponseDto> updateMedicine(
            @PathVariable Long id,
            @Valid @RequestBody MedicineRequestDto dto) {
        return ResponseEntity.ok(medicineService.updateMedicine(id, dto));
    }

    // ── Admin: Restock medicine (add stock quantity) ────────────────────────
    @PatchMapping("/{id}/restock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MedicineResponseDto> restockMedicine(
            @PathVariable Long id,
            @RequestParam int quantity) {
        return ResponseEntity.ok(medicineService.restockMedicine(id, quantity));
    }

    // ── Admin: Delete medicine ──────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok("Medicine deleted successfully");
    }

    // ── Admin: Get low-stock alert list ────────────────────────────────────
    @GetMapping("/low-stock")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MedicineResponseDto>> getLowStockMedicines() {
        return ResponseEntity.ok(medicineService.getLowStockMedicines());
    }

    // ── Doctor/Admin: Search by name (for prescription dropdown) ───────────
    @GetMapping("/search")
    @Secured({"ROLE_DOCTOR", "ROLE_PATIENT"})
    public List<MedicineResponseDto> searchByName(@RequestParam String name) {
        return medicineService.searchByName(name);
    }

    // ── All: Get all medicines ──────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<List<MedicineResponseDto>> getAllMedicines() {
        return ResponseEntity.ok(medicineService.getAllMedicines());
    }

    // ── All: Filter by type ─────────────────────────────────────────────────
    @GetMapping("/type/{type}")
    @Secured({"ROLE_DOCTOR", "ROLE_PATIENT"})
    public List<MedicineResponseDto> getByType(@PathVariable MedicineType type) {
        return medicineService.getByType(type);
    }

}