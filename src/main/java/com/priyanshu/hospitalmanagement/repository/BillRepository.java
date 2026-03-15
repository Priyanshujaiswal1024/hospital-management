package com.priyanshu.hospitalmanagement.repository;

import com.priyanshu.hospitalmanagement.entity.Bill;
import com.priyanshu.hospitalmanagement.entity.type.BillStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BillRepository extends JpaRepository<Bill, Long> {

    // Used by BillService.getBillsForLoggedInPatient()
    List<Bill> findByAppointment_Patient_Id(Long patientId);

    // Used by BillService.generateBill() duplicate guard
    boolean existsByAppointment_Id(Long appointmentId);

    // FIX 1: b.totalAmount (not b.amount)
    // FIX 2: Double return type to safely handle empty table
    // FIX 3: compare against enum constant, not string literal
    @Query("SELECT COALESCE(SUM(b.totalAmount), 0) FROM Bill b WHERE b.status = :status")
    Double getTotalRevenueByStatus(@Param("status") BillStatus status);

    // Convenience — admin dashboard "total paid revenue"
    default Double getTotalRevenue() {
        return getTotalRevenueByStatus(BillStatus.PAID);
    }

    // All bills for a given status (e.g. all UNPAID for collections view)
    List<Bill> findByStatus(BillStatus status);

    // Bills created within a date range (admin reporting)
    List<Bill> findByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    // Count by status (admin dashboard stats card)
    long countByStatus(BillStatus status);
}