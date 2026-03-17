package com.priyanshu.hospitalmanagement.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.priyanshu.hospitalmanagement.dto.CreatePrescriptionRequestDto;
import com.priyanshu.hospitalmanagement.dto.MedicineItemDto;
import com.priyanshu.hospitalmanagement.dto.PrescriptionMedicineResponseDto;
import com.priyanshu.hospitalmanagement.dto.PrescriptionResponseDto;
import com.priyanshu.hospitalmanagement.entity.*;
import com.priyanshu.hospitalmanagement.entity.type.AppointmentStatus;
import com.priyanshu.hospitalmanagement.repository.*;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final AppointmentRepository appointmentRepository;
    private final BillService billService;
    private final MedicineRepository medicineRepository;
    private final PatientRepository patientRepository;

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE PRESCRIPTION — doctor only sets medicines
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public PrescriptionResponseDto createPrescription(
            Long appointmentId,
            CreatePrescriptionRequestDto requestDto) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException(
                        "Appointment not found: " + appointmentId));

        // Prevent duplicate prescription for same appointment
        if (prescriptionRepository.existsByAppointmentId(appointmentId)) {
            throw new RuntimeException(
                    "Prescription already exists for appointment: " + appointmentId);
        }

        Prescription prescription = new Prescription();
        prescription.setAppointment(appointment);
        // NO diagnosis, NO notes — those belong to MedicalRecord

        if (requestDto.getMedicines() != null && !requestDto.getMedicines().isEmpty()) {

            List<PrescriptionMedicine> prescriptionMedicines = new ArrayList<>();

            for (MedicineItemDto item : requestDto.getMedicines()) {

                Medicine medicine = medicineRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new RuntimeException(
                                "Medicine not found: " + item.getMedicineId()));

                // Check stock before deducting
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                if (medicine.getStock() < qty) {
                    throw new RuntimeException(
                            "Insufficient stock for medicine: " + medicine.getName()
                                    + ". Available: " + medicine.getStock()
                                    + ", Required: " + qty);
                }

                // Map DTO → entity
                PrescriptionMedicine pm = new PrescriptionMedicine();
                pm.setMedicine(medicine);
                pm.setFrequency(item.getFrequency());
                pm.setDurationDays(item.getDurationDays());
                pm.setQuantity(qty);
                pm.setInstructions(item.getInstructions());
                pm.setPrescription(prescription);
                prescriptionMedicines.add(pm);

                // Deduct stock
                medicine.setStock(medicine.getStock() - qty);
                medicineRepository.save(medicine);
            }

            prescription.setMedicines(prescriptionMedicines);
        }

        // Save prescription (cascades to PrescriptionMedicine)
        Prescription saved = prescriptionRepository.save(prescription);

        // Mark appointment completed after prescription saved
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        // Generate bill
        billService.generateBill(appointmentId);

        return mapToResponseDto(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOWNLOAD PDF
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] downloadPrescriptionPdf(Long id) throws Exception {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException(
                        "Prescription not found: " + id));
        return generatePrescriptionPdf(prescription);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENERATE PDF
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] generatePrescriptionPdf(Prescription prescription) throws Exception {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 60, 60);
        PdfWriter.getInstance(document, out);
        document.open();

        // ── Fonts ──────────────────────────────────────────────────────────
        Font titleFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
        Font headerFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
        Font normalFont  = FontFactory.getFont(FontFactory.HELVETICA,      11);
        Font smallFont   = FontFactory.getFont(FontFactory.HELVETICA,       9);
        Font boldFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font whiteFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10,
                new java.awt.Color(255, 255, 255));

        java.awt.Color accent = new java.awt.Color(41, 128, 185);

        // ── Hospital Header ────────────────────────────────────────────────
        Paragraph hospitalName = new Paragraph("City Care Hospital", titleFont);
        hospitalName.setAlignment(Element.ALIGN_CENTER);
        document.add(hospitalName);

        Paragraph hospitalAddress = new Paragraph(
                "123 Health Street, Delhi | Ph: +91-11-XXXX-XXXX", normalFont);
        hospitalAddress.setAlignment(Element.ALIGN_CENTER);
        document.add(hospitalAddress);

        document.add(new Paragraph(" "));

        // Divider
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell divCell = new PdfPCell();
        divCell.setBackgroundColor(accent);
        divCell.setFixedHeight(3f);
        divCell.setBorder(Rectangle.NO_BORDER);
        divider.addCell(divCell);
        document.add(divider);

        document.add(new Paragraph(" "));

        // ── Title ──────────────────────────────────────────────────────────
        Paragraph rxTitle = new Paragraph("PRESCRIPTION", headerFont);
        rxTitle.setAlignment(Element.ALIGN_LEFT);
        document.add(rxTitle);

        document.add(new Paragraph(" "));

        // ── Patient / Doctor Info ──────────────────────────────────────────
        PdfPTable infoTable = new PdfPTable(new float[]{1, 1});
        infoTable.setWidthPercentage(100);

        addInfoCell(infoTable, "Patient Name",
                prescription.getAppointment().getPatient().getName(),
                boldFont, normalFont);
        addInfoCell(infoTable, "Doctor Name",
                prescription.getAppointment().getDoctor().getName(),
                boldFont, normalFont);

        String date = prescription.getCreatedAt() != null
                ? prescription.getCreatedAt().toLocalDate().toString()
                : "N/A";
        addInfoCell(infoTable, "Date", date, boldFont, normalFont);
        addInfoCell(infoTable, "Appointment ID",
                String.valueOf(prescription.getAppointment().getId()),
                boldFont, normalFont);

        document.add(infoTable);
        document.add(new Paragraph(" "));

        // ── Medicines Table ────────────────────────────────────────────────
        Paragraph medsLabel = new Paragraph("Prescribed Medicines:", boldFont);
        document.add(medsLabel);
        document.add(new Paragraph(" "));

        PdfPTable medTable = new PdfPTable(new float[]{2.5f, 1.5f, 1f, 0.8f, 2f});
        medTable.setWidthPercentage(100);

        // Header row
        for (String h : new String[]{"Medicine", "Frequency", "Duration", "Qty", "Instructions"}) {
            PdfPCell cell = new PdfPCell(new Paragraph(h, whiteFont));
            cell.setBackgroundColor(accent);
            cell.setPadding(6f);
            medTable.addCell(cell);
        }

        List<PrescriptionMedicine> medicines = prescription.getMedicines();
        if (medicines != null && !medicines.isEmpty()) {
            boolean alternate = false;
            for (PrescriptionMedicine pm : medicines) {
                java.awt.Color rowColor = alternate
                        ? new java.awt.Color(235, 245, 255)
                        : java.awt.Color.WHITE;
                alternate = !alternate;

                addMedCell(medTable, pm.getMedicine().getName(), normalFont, rowColor);
                addMedCell(medTable, pm.getFrequency(), normalFont, rowColor);
                addMedCell(medTable, pm.getDurationDays() + " days", normalFont, rowColor);
                addMedCell(medTable, String.valueOf(pm.getQuantity()), normalFont, rowColor);
                addMedCell(medTable,
                        pm.getInstructions() != null ? pm.getInstructions() : "—",
                        normalFont, rowColor);
            }
        } else {
            PdfPCell emptyCell = new PdfPCell(
                    new Paragraph("No medicines prescribed", smallFont));
            emptyCell.setColspan(5);
            emptyCell.setPadding(6f);
            medTable.addCell(emptyCell);
        }

        document.add(medTable);
        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // ── Signature ─────────────────────────────────────────────────────
        PdfPTable sigTable = new PdfPTable(new float[]{1, 1});
        sigTable.setWidthPercentage(100);

        PdfPCell leftSig = new PdfPCell();
        leftSig.setBorder(Rectangle.NO_BORDER);
        leftSig.addElement(new Paragraph(
                "Patient Signature: ____________________", normalFont));
        sigTable.addCell(leftSig);

        PdfPCell rightSig = new PdfPCell();
        rightSig.setBorder(Rectangle.NO_BORDER);
        rightSig.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightSig.addElement(new Paragraph(
                "Doctor Signature: ____________________", normalFont));
        sigTable.addCell(rightSig);

        document.add(sigTable);
        document.add(new Paragraph(" "));

        // Footer
        Paragraph footer = new Paragraph(
                "This is a computer-generated prescription. Valid only with doctor's stamp.",
                smallFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET PRESCRIPTIONS FOR LOGGED-IN PATIENT
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionResponseDto> getPrescriptionsForLoggedInPatient(
            String username) {

        Patient patient = patientRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException(
                        "Patient not found: " + username));

        return prescriptionRepository
                .findByAppointment_Patient_Id(patient.getId())
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET PRESCRIPTIONS FOR DOCTOR
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionResponseDto> getPrescriptionsForDoctor(Long doctorId) {
        return prescriptionRepository
                .findByAppointment_Doctor_Id(doctorId)
                .stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private PrescriptionResponseDto mapToResponseDto(Prescription p) {

        List<PrescriptionMedicineResponseDto> medicineDtos = new ArrayList<>();

        if (p.getMedicines() != null) {
            medicineDtos = p.getMedicines().stream()
                    .map(pm -> PrescriptionMedicineResponseDto.builder()
                            .medicineId(pm.getMedicine().getId())
                            .medicineName(pm.getMedicine().getName())
                            .frequency(pm.getFrequency())
                            .durationDays(pm.getDurationDays())
                            .quantity(pm.getQuantity())
                            .instructions(pm.getInstructions())
                            .build())
                    .toList();
        }

        return PrescriptionResponseDto.builder()
                .id(p.getId())
                // NO diagnosis, NO notes
                .medicines(medicineDtos)
                .appointmentId(p.getAppointment().getId())
                .patientName(p.getAppointment().getPatient().getName())
                .doctorName(p.getAppointment().getDoctor().getName())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private void addInfoCell(PdfPTable table, String label, String value,
                             Font boldFont, Font normalFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingBottom(6f);
        cell.addElement(new Paragraph(label + ": ", boldFont));
        cell.addElement(new Paragraph(value != null ? value : "—", normalFont));
        table.addCell(cell);
    }

    private void addMedCell(PdfPTable table, String value,
                            Font font, java.awt.Color bgColor) {
        PdfPCell cell = new PdfPCell(
                new Paragraph(value != null ? value : "—", font));
        cell.setPadding(5f);
        cell.setBackgroundColor(bgColor);
        table.addCell(cell);
    }
}