package com.priyanshu.hospitalmanagement.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Set;

@Data
@Builder
public class AdminProfileDto {
    private Long id;
    private String email;
    private String fullName;
    private String phone;
    private Set<String> roles;
}