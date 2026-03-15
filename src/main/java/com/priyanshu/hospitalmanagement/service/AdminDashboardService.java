package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.AdminDashboardResponseDto;
import com.priyanshu.hospitalmanagement.entity.type.AppointmentStatus;
import com.priyanshu.hospitalmanagement.entity.type.BillStatus;
import com.priyanshu.hospitalmanagement.repository.AppointmentRepository;
import com.priyanshu.hospitalmanagement.repository.BillRepository;
import com.priyanshu.hospitalmanagement.repository.DepartmentRepository;
import com.priyanshu.hospitalmanagement.repository.DoctorRepository;
import com.priyanshu.hospitalmanagement.repository.MedicineRepository;
import com.priyanshu.hospitalmanagement.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;
    private final DepartmentRepository departmentRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillRepository billRepository;           // FIX 1: added
    private final MedicineRepository medicineRepository;   // FIX 4: added

    @Transactional(readOnly = true)                        // FIX 2: single transaction
    public AdminDashboardResponseDto getDashboardStats() {

        // ── Counts ────────────────────────────────────────────────────────
        long totalDoctors      = doctorRepository.count();
        long totalPatients     = patientRepository.count();
        long totalDepartments  = departmentRepository.count();
        long totalAppointments = appointmentRepository.count();

        // ── Appointment breakdown by status ───────────────────────────────
        long bookedAppointments    = appointmentRepository.countByStatus(AppointmentStatus.BOOKED);
        long confirmedAppointments = appointmentRepository.countByStatus(AppointmentStatus.CONFIRMED);
        long completedAppointments = appointmentRepository.countByStatus(AppointmentStatus.COMPLETED);
        long cancelledAppointments = appointmentRepository.countByStatus(AppointmentStatus.CANCELLED);
        long todayAppointments     = appointmentRepository.countTodayAppointments();

        // ── Billing stats ─────────────────────────────────────────────────
        Double totalRevenue    = billRepository.getTotalRevenue();           // PAID bills sum
        long   unpaidBillCount = billRepository.countByStatus(BillStatus.UNPAID);

        // ── Medicine alert ────────────────────────────────────────────────
        long lowStockCount = medicineRepository.countByStockLessThanEqual(10);

        return AdminDashboardResponseDto.builder()
                .totalDoctors(totalDoctors)
                .totalPatients(totalPatients)
                .totalDepartments(totalDepartments)
                .totalAppointments(totalAppointments)
                .bookedAppointments(bookedAppointments)
                .confirmedAppointments(confirmedAppointments)
                .completedAppointments(completedAppointments)
                .cancelledAppointments(cancelledAppointments)
                .todayAppointments(todayAppointments)
                .totalRevenue(totalRevenue != null ? totalRevenue : 0.0)
                .unpaidBillCount(unpaidBillCount)
                .lowStockMedicineCount(lowStockCount)
                .build();
    }
}