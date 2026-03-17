package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.*;
import com.priyanshu.hospitalmanagement.entity.User;

import java.util.List;

public interface AdminService {

    List<PatientResponseDto> getAllPatients(Integer page,
                                           Integer size);

    List<DoctorResponseDto> getAllDoctors(int page, int size);

    DoctorResponseDto createDoctor(CreateDoctorRequestDto dto);

    DoctorResponseDto updateDoctor(Long doctorId, CreateDoctorRequestDto dto);

    void deleteDoctor(Long doctorId);
    User createAdmin(CreateAdminRequestDto dto);
    DashboardResponseDto getDashboard();

    AdminProfileDto getAdminProfile(String username);

    List<AdminProfileDto> getAllAdmins();
}