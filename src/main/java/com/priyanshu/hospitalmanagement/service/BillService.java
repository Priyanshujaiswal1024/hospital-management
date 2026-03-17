package com.priyanshu.hospitalmanagement.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.priyanshu.hospitalmanagement.dto.BillResponseDto;
import com.priyanshu.hospitalmanagement.entity.Appointment;
import com.priyanshu.hospitalmanagement.entity.Bill;
import com.priyanshu.hospitalmanagement.entity.Department;
import com.priyanshu.hospitalmanagement.entity.Patient;
import com.priyanshu.hospitalmanagement.entity.type.BillStatus;
import com.priyanshu.hospitalmanagement.repository.AppointmentRepository;
import com.priyanshu.hospitalmanagement.repository.BillRepository;
import com.priyanshu.hospitalmanagement.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillService {

    private final BillRepository billRepository;
    private final AppointmentRepository appointmentRepository;
    private final PatientRepository patientRepository;

    private static final double GST_RATE = 0.18;
    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    @Transactional
    public BillResponseDto generateBill(Long appointmentId) {

        if (billRepository.existsByAppointment_Id(appointmentId)) {
            throw new RuntimeException("Bill already generated for appointment: " + appointmentId);
        }

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));

        double consultationFee = appointment.getDoctor().getConsultationFee();
        double gstAmount       = Math.round(consultationFee * GST_RATE * 100.0) / 100.0;
        double totalAmount     = Math.round((consultationFee + gstAmount) * 100.0) / 100.0;

        Bill bill = new Bill();
        bill.setAppointment(appointment);
        bill.setConsultationFee(consultationFee);
        bill.setGstAmount(gstAmount);
        bill.setTotalAmount(totalAmount);
        bill.setStatus(BillStatus.UNPAID);
        bill.setCreatedAt(LocalDateTime.now());

        Bill saved = billRepository.save(bill);
        return mapToDto(saved);
    }

    @Transactional
    public BillResponseDto markBillAsPaid(Long billId) {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billId));

        if (bill.getStatus() == BillStatus.PAID) {
            throw new RuntimeException("Bill " + billId + " is already marked as paid.");
        }

        bill.setStatus(BillStatus.PAID);
        bill.setPaidAt(LocalDateTime.now());
        billRepository.save(bill);

        return mapToDto(bill);
    }

    @Transactional(readOnly = true)
    public List<BillResponseDto> getBillsForLoggedInPatient(String username) {

        Patient patient = patientRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + username));

        return billRepository.findByAppointment_Patient_Id(patient.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(Long billId) throws Exception {

        Bill bill = billRepository.findById(billId)
                .orElseThrow(() -> new RuntimeException("Bill not found: " + billId));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 60, 60);
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22);
        Font boldFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA,      11);
        Font smallFont  = FontFactory.getFont(FontFactory.HELVETICA,       9);
        Font thFont     = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10,
                new java.awt.Color(255, 255, 255));
        Font greenFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16,
                new java.awt.Color(39, 174, 96));
        Font redFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16,
                new java.awt.Color(192, 57, 43));

        java.awt.Color accentColor = new java.awt.Color(41, 128, 185);
        java.awt.Color altRowColor = new java.awt.Color(235, 245, 255);

        Paragraph hospitalName = new Paragraph("City Care Hospital", titleFont);
        hospitalName.setAlignment(Element.ALIGN_CENTER);
        document.add(hospitalName);

        Paragraph hospitalAddress = new Paragraph(
                "123 Health Street, Delhi | Ph: +91-11-XXXX-XXXX | GST: 07XXXXX1234Z5", normalFont);
        hospitalAddress.setAlignment(Element.ALIGN_CENTER);
        document.add(hospitalAddress);

        document.add(new Paragraph(" "));
        addDivider(document, accentColor);
        document.add(new Paragraph(" "));

        PdfPTable titleRow = new PdfPTable(new float[]{1, 1});
        titleRow.setWidthPercentage(100);

        PdfPCell invoiceLabel = new PdfPCell(new Paragraph("INVOICE", boldFont));
        invoiceLabel.setBorder(Rectangle.NO_BORDER);
        titleRow.addCell(invoiceLabel);

        PdfPCell billNumCell = new PdfPCell(
                new Paragraph("Bill #: INV-" + String.format("%05d", bill.getId()), boldFont));
        billNumCell.setBorder(Rectangle.NO_BORDER);
        billNumCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        titleRow.addCell(billNumCell);
        document.add(titleRow);
        document.add(new Paragraph(" "));

        // ── FIX: use getDepartments() instead of getDepartment() ──────────
        String departmentName = bill.getAppointment().getDoctor().getDepartments().stream()
                .findFirst()
                .map(Department::getName)
                .orElse("—");

        PdfPTable infoTable = new PdfPTable(new float[]{1, 1});
        infoTable.setWidthPercentage(100);

        addInfoCell(infoTable, "Patient Name",
                bill.getAppointment().getPatient().getName(), boldFont, normalFont);
        addInfoCell(infoTable, "Bill Date",
                bill.getCreatedAt().format(DATE_FMT), boldFont, normalFont);
        addInfoCell(infoTable, "Doctor Name",
                bill.getAppointment().getDoctor().getName(), boldFont, normalFont);
        addInfoCell(infoTable, "Appointment Date",
                bill.getAppointment().getAppointmentTime().format(DATE_FMT), boldFont, normalFont);
        addInfoCell(infoTable, "Department", departmentName, boldFont, normalFont);
        addInfoCell(infoTable, "Status", bill.getStatus().name(), boldFont, normalFont);

        document.add(infoTable);
        document.add(new Paragraph(" "));

        PdfPTable billingTable = new PdfPTable(new float[]{3, 1.5f, 1.5f});
        billingTable.setWidthPercentage(100);

        for (String h : new String[]{"Description", "Rate", "Amount"}) {
            PdfPCell cell = new PdfPCell(new Paragraph(h, thFont));
            cell.setBackgroundColor(accentColor);
            cell.setPadding(7f);
            billingTable.addCell(cell);
        }

        addBillingRow(billingTable, "Consultation Fee",
                "₹" + String.format("%.2f", bill.getConsultationFee()),
                "₹" + String.format("%.2f", bill.getConsultationFee()),
                normalFont, java.awt.Color.WHITE);

        double gst = bill.getGstAmount() != null
                ? bill.getGstAmount()
                : Math.round(bill.getConsultationFee() * GST_RATE * 100.0) / 100.0;

        addBillingRow(billingTable, "GST (18%)", "18%",
                "₹" + String.format("%.2f", gst), normalFont, altRowColor);

        document.add(billingTable);
        document.add(new Paragraph(" "));

        double total = bill.getTotalAmount() != null
                ? bill.getTotalAmount()
                : bill.getConsultationFee() + gst;

        PdfPTable totalTable = new PdfPTable(new float[]{3, 3});
        totalTable.setWidthPercentage(100);

        Font whiteBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12,
                new java.awt.Color(255, 255, 255));

        PdfPCell totalLabelCell = new PdfPCell(new Paragraph("TOTAL PAYABLE", whiteBold));
        totalLabelCell.setBackgroundColor(new java.awt.Color(44, 62, 80));
        totalLabelCell.setPadding(8f);
        totalTable.addCell(totalLabelCell);

        PdfPCell totalValueCell = new PdfPCell(
                new Paragraph("₹" + String.format("%.2f", total), whiteBold));
        totalValueCell.setBackgroundColor(new java.awt.Color(44, 62, 80));
        totalValueCell.setPadding(8f);
        totalValueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        totalTable.addCell(totalValueCell);

        document.add(totalTable);
        document.add(new Paragraph(" "));

        boolean isPaid = bill.getStatus() == BillStatus.PAID;
        Paragraph statusStamp = new Paragraph(
                isPaid ? "✓ PAID" : "⚠ PAYMENT PENDING",
                isPaid ? greenFont : redFont);
        statusStamp.setAlignment(Element.ALIGN_CENTER);
        document.add(statusStamp);

        if (isPaid && bill.getPaidAt() != null) {
            Paragraph paidOn = new Paragraph(
                    "Paid on: " + bill.getPaidAt().format(DATE_FMT), smallFont);
            paidOn.setAlignment(Element.ALIGN_CENTER);
            document.add(paidOn);
        }

        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        PdfPTable sigTable = new PdfPTable(new float[]{1, 1});
        sigTable.setWidthPercentage(100);

        PdfPCell leftSig = new PdfPCell();
        leftSig.setBorder(Rectangle.NO_BORDER);
        leftSig.addElement(new Paragraph("Patient Signature: ____________________", normalFont));
        sigTable.addCell(leftSig);

        PdfPCell rightSig = new PdfPCell();
        rightSig.setBorder(Rectangle.NO_BORDER);
        rightSig.addElement(new Paragraph("Authorized Signature: ____________________", normalFont));
        rightSig.setHorizontalAlignment(Element.ALIGN_RIGHT);
        sigTable.addCell(rightSig);

        document.add(sigTable);
        document.add(new Paragraph(" "));

        Paragraph footer = new Paragraph(
                "This is a system-generated invoice. For queries contact: billing@citycarehospital.in",
                smallFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    private BillResponseDto mapToDto(Bill bill) {
        return BillResponseDto.builder()
                .id(bill.getId())
                .consultationFee(bill.getConsultationFee())
                .gstAmount(bill.getGstAmount())
                .totalAmount(bill.getTotalAmount())
                .status(bill.getStatus().name())
                .appointmentId(bill.getAppointment().getId())
                .patientName(bill.getAppointment().getPatient().getName())
                .doctorName(bill.getAppointment().getDoctor().getName())
                .createdAt(bill.getCreatedAt())
                .paidAt(bill.getPaidAt())
                .build();
    }

    private void addInfoCell(PdfPTable table, String label, String value,
                             Font boldFont, Font normalFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingBottom(6f);
        cell.addElement(new Paragraph(label + ":", boldFont));
        cell.addElement(new Paragraph(value != null ? value : "—", normalFont));
        table.addCell(cell);
    }

    private void addBillingRow(PdfPTable table, String desc, String rate,
                               String amount, Font font, java.awt.Color bg) {
        for (String val : new String[]{desc, rate, amount}) {
            PdfPCell cell = new PdfPCell(new Paragraph(val, font));
            cell.setPadding(6f);
            cell.setBackgroundColor(bg);
            table.addCell(cell);
        }
    }

    private void addDivider(Document doc, java.awt.Color color) throws DocumentException {
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(color);
        cell.setFixedHeight(3f);
        cell.setBorder(Rectangle.NO_BORDER);
        divider.addCell(cell);
        doc.add(divider);
    }

    @Transactional(readOnly = true)
    public List<BillResponseDto> getAllBills(int page, int size) {
        return billRepository
                .findAll(PageRequest.of(page, size))
                .stream()
                .map(this::mapToDto)
                .toList();
    }
}