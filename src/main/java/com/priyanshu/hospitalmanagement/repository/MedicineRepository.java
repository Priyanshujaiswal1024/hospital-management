package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Medicine;
import com.priyanshu.hospitalmanagement.entity.type.MedicineType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MedicineRepository extends JpaRepository<Medicine, Long> {

    boolean existsByNameIgnoreCase(String name);

    List<Medicine> findByNameContainingIgnoreCase(String name);

    List<Medicine> findByStockLessThanEqual(int threshold);

    // ← this is what AdminDashboardService needs
    long countByStockLessThanEqual(int threshold);

    List<Medicine> findByType(MedicineType type);
}