package com.priyanshu.hospitalmanagement.dto;

import lombok.Data;

@Data
public class CreateAdminRequestDto {
     private String email;
     private String password;
     private String fullName;
     private String phone;
}