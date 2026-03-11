package com.priyanshu.hospitalmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalTime;

@Data
@AllArgsConstructor
public class AvailableSlotDto {

    private LocalTime startTime;
    private LocalTime endTime;
}