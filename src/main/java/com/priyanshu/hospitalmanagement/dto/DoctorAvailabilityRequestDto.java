package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class DoctorAvailabilityRequestDto {

    private Long doctorId;

    private LocalDate date;

    private LocalTime startTime;

    private LocalTime endTime;
}