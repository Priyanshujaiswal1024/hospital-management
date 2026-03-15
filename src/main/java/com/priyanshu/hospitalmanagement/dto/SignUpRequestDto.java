package com.priyanshu.hospitalmanagement.dto;

import jakarta.validation.constraints.Email;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignUpRequestDto {

    @Email
    private String username;

    private String password;

    private String fullName;

    private String phone;
}