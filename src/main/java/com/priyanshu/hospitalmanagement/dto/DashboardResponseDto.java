package com.priyanshu.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DashboardResponseDto {

    private long totalDoctors;
    private long totalPatients;
    private long totalAppointments;
    private long todayAppointments;
    private long totalDepartments;

}