package com.priyanshu.hospitalmanagement.controller;

import com.priyanshu.hospitalmanagement.service.BillService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/bills")
@RequiredArgsConstructor
public class AdminBillController {

    private final BillService billService;

    @PatchMapping("/{billId}/mark-paid")
    public ResponseEntity<String> markBillPaid(
            @PathVariable Long billId) {

        billService.markBillAsPaid(billId);

        return ResponseEntity.ok("Bill marked as PAID");
    }
}