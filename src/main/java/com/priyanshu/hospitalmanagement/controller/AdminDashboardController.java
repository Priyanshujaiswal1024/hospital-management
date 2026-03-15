package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.AdminDashboardResponseDto;
import com.priyanshu.hospitalmanagement.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.annotation.Secured;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin/dashboard")  // ← remove the /api/v1 prefix
@RequiredArgsConstructor
@Secured("ROLE_ADMIN")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    @GetMapping
    public ResponseEntity<AdminDashboardResponseDto> getDashboardStats() {
        return ResponseEntity.ok(adminDashboardService.getDashboardStats());
    }
}