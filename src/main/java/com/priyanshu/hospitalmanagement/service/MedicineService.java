package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.MedicineRequestDto;
import com.priyanshu.hospitalmanagement.dto.MedicineResponseDto;
import com.priyanshu.hospitalmanagement.entity.Medicine;
import com.priyanshu.hospitalmanagement.entity.type.MedicineType;
import com.priyanshu.hospitalmanagement.repository.MedicineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicineService {

    private final MedicineRepository medicineRepository;

    // Medicines at or below this threshold trigger a low-stock warning
    private static final int LOW_STOCK_THRESHOLD = 10;

    // ─────────────────────────────────────────────────────────────────────────
    // ADD MEDICINE (Admin only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public MedicineResponseDto addMedicine(MedicineRequestDto dto) {

        // Guard: prevent duplicate medicine names
        if (medicineRepository.existsByNameIgnoreCase(dto.getName())) {
            throw new RuntimeException("Medicine already exists: " + dto.getName());
        }

        Medicine medicine = Medicine.builder()
                .name(dto.getName())
                .category(dto.getCategory())
                .type(dto.getType())
                .dosage(dto.getDosage())
                .manufacturer(dto.getManufacturer())
                .price(dto.getPrice())
                .stock(dto.getStock())
                .build();

        return mapToDto(medicineRepository.save(medicine));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // UPDATE MEDICINE (Admin only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public MedicineResponseDto updateMedicine(Long id, MedicineRequestDto dto) {

        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found: " + id));

        medicine.setName(dto.getName());
        medicine.setCategory(dto.getCategory());
        medicine.setType(dto.getType());
        medicine.setDosage(dto.getDosage());
        medicine.setManufacturer(dto.getManufacturer());
        medicine.setPrice(dto.getPrice());
        medicine.setStock(dto.getStock());

        return mapToDto(medicineRepository.save(medicine));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // RESTOCK MEDICINE (Admin only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public MedicineResponseDto restockMedicine(Long id, int quantityToAdd) {

        if (quantityToAdd <= 0) {
            throw new RuntimeException("Quantity to add must be greater than 0");
        }

        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found: " + id));

        medicine.setStock(medicine.getStock() + quantityToAdd);
        return mapToDto(medicineRepository.save(medicine));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DELETE MEDICINE (Admin only)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public void deleteMedicine(Long id) {
        if (!medicineRepository.existsById(id)) {
            throw new RuntimeException("Medicine not found: " + id);
        }
        medicineRepository.deleteById(id);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET ALL MEDICINES
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MedicineResponseDto> getAllMedicines() {
        return medicineRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SEARCH BY NAME (used by doctor prescription form dropdown)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MedicineResponseDto> searchByName(String name) {
        return medicineRepository.findByNameContainingIgnoreCase(name)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET LOW STOCK MEDICINES (Admin dashboard alert)
    // Returns all medicines where stock <= LOW_STOCK_THRESHOLD
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MedicineResponseDto> getLowStockMedicines() {
        return medicineRepository.findByStockLessThanEqual(LOW_STOCK_THRESHOLD)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET BY TYPE (e.g., TABLET, SYRUP, INJECTION)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MedicineResponseDto> getByType(MedicineType type) {
        return medicineRepository.findByType(type)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPER
    // ─────────────────────────────────────────────────────────────────────────
    private MedicineResponseDto mapToDto(Medicine m) {
        return MedicineResponseDto.builder()
                .id(m.getId())
                .name(m.getName())
                .category(m.getCategory())
                .type(m.getType() != null ? m.getType().name() : null)
                .dosage(m.getDosage())
                .manufacturer(m.getManufacturer())
                .price(m.getPrice())
                .stock(m.getStock())
                .lowStock(m.getStock() != null && m.getStock() <= LOW_STOCK_THRESHOLD)
                .build();
    }

    @Transactional(readOnly = true)
    public MedicineResponseDto getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Medicine not found: " + id));
        return mapToDto(medicine);
    }
}