package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class CreateDepartmentRequestDto {
    private String name;
    private Long headDoctorId;

}
