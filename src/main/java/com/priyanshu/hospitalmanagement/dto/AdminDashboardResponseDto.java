package com.priyanshu.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminDashboardResponseDto {

    // Counts
    private long totalDoctors;
    private long totalPatients;
    private long totalDepartments;

    // Appointments
    private long totalAppointments;
    private long bookedAppointments;
    private long confirmedAppointments;
    private long completedAppointments;
    private long cancelledAppointments;
    private long todayAppointments;

    // Billing
    private double totalRevenue;       // ← new
    private long   unpaidBillCount;    // ← new

    // Medicines
    private long lowStockMedicineCount; // ← new
}