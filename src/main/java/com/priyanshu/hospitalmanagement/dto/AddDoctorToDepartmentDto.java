package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class AddDoctorToDepartmentDto {

    private Long departmentId;
    private Long doctorId;
}