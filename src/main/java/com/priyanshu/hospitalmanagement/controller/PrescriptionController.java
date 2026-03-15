package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.CreatePrescriptionRequestDto;
import com.priyanshu.hospitalmanagement.dto.PrescriptionResponseDto;
import com.priyanshu.hospitalmanagement.entity.Prescription;
import com.priyanshu.hospitalmanagement.repository.PrescriptionRepository;
import com.priyanshu.hospitalmanagement.service.DoctorService;
import com.priyanshu.hospitalmanagement.service.PrescriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/prescriptions")
@RequiredArgsConstructor
public class PrescriptionController {

    private final PrescriptionService prescriptionService;
    private final PrescriptionRepository prescriptionRepository;

    @PostMapping("/{appointmentId}")
    public ResponseEntity<PrescriptionResponseDto> createPrescription(
            @PathVariable Long appointmentId,
            @RequestBody CreatePrescriptionRequestDto requestDto) {

        return ResponseEntity.ok(
                prescriptionService.createPrescription(appointmentId, requestDto)
        );
    }
    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadPrescription(
            @PathVariable Long id) throws Exception {

        byte[] pdf = prescriptionService.downloadPrescriptionPdf(id);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=prescription.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}