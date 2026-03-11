package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class CreateDoctorRequestDto {

    private String username;
    private String password;
    private String name;
    private String email;
    private String specialization;
    private Long departmentId;

}