package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.CreateMedicalRecordRequestDto;
import com.priyanshu.hospitalmanagement.dto.MedicalRecordResponseDto;
import com.priyanshu.hospitalmanagement.entity.UserPrincipal;
import com.priyanshu.hospitalmanagement.service.MedicalRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/medical-records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService medicalRecordService;

    // ── Create medical record (Doctor/Admin) ───────────────────────────────
    @PostMapping
    public ResponseEntity<MedicalRecordResponseDto> createMedicalRecord(
            @Valid @RequestBody CreateMedicalRecordRequestDto dto) {
        return ResponseEntity.ok(medicalRecordService.createMedicalRecord(dto));
    }

    // ── Get all records for logged-in patient ──────────────────────────────
    @GetMapping("/my")
    public ResponseEntity<List<MedicalRecordResponseDto>> getMyMedicalRecords(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(
                medicalRecordService.getMedicalRecordsForLoggedInPatient(
                        userPrincipal.getUsername()));
    }
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadMedicalRecord(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal userPrincipal) throws Exception {

        byte[] pdf = medicalRecordService.downloadMedicalRecordPdf(
                id, userPrincipal.getUsername());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"medical-record-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}

