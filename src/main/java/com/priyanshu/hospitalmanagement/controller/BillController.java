package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.dto.BillResponseDto;
import com.priyanshu.hospitalmanagement.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/bills")
@RequiredArgsConstructor
public class BillController {

    private final BillService billService;



    // Get all bills for a patient
    @GetMapping("/patient")
    public ResponseEntity<List<BillResponseDto>> getMyBills(
            Authentication authentication) {

        String username = authentication.getName();

        return ResponseEntity.ok(
                billService.getBillsForLoggedInPatient(username)
        );
    }
    // Download invoice PDF
    @GetMapping("/{billId}/download")
    public ResponseEntity<byte[]> downloadInvoice(
            @PathVariable Long billId) throws Exception {

        byte[] pdf = billService.generateInvoicePdf(billId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=invoice.pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
    // Mark bill as paid (optional)

}