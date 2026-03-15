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
import java.time.LocalDateTime;
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
    // CREATE PRESCRIPTION
    // FIX 1: @Transactional — if anything fails, all DB changes roll back
    // FIX 2: Duplicate-prescription guard
    // FIX 3: Single medicine fetch — used for BOTH mapping AND stock deduction
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public PrescriptionResponseDto createPrescription(
            Long appointmentId,
            CreatePrescriptionRequestDto requestDto) {

        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new RuntimeException("Appointment not found: " + appointmentId));

        // FIX 2: Prevent duplicate prescription for same appointment
        boolean alreadyExists = prescriptionRepository.existsByAppointmentId(appointmentId);
        if (alreadyExists) {
            throw new RuntimeException("Prescription already exists for appointment: " + appointmentId);
        }

        Prescription prescription = new Prescription();
        prescription.setDiagnosis(requestDto.getDiagnosis());
        prescription.setNotes(requestDto.getNotes());
//        prescription.setCreatedAt(LocalDateTime.now());
        prescription.setAppointment(appointment);

        // FIX 3: Fetch each medicine ONCE and reuse for both mapping + stock deduction
        if (requestDto.getMedicines() != null && !requestDto.getMedicines().isEmpty()) {

            List<PrescriptionMedicine> prescriptionMedicines = new ArrayList<>();

            for (MedicineItemDto item : requestDto.getMedicines()) {

                Medicine medicine = medicineRepository.findById(item.getMedicineId())
                        .orElseThrow(() -> new RuntimeException(
                                "Medicine not found: " + item.getMedicineId()));

                // Map DTO → PrescriptionMedicine entity
                PrescriptionMedicine pm = new PrescriptionMedicine();
                pm.setMedicine(medicine);
                pm.setFrequency(item.getFrequency());
                pm.setDurationDays(item.getDurationDays());
                pm.setQuantity(item.getQuantity());
                pm.setInstructions(item.getInstructions());
                pm.setPrescription(prescription);  // back-reference for FK
                prescriptionMedicines.add(pm);

                // FIX 3: Deduct stock right here — medicine already in memory
                int qty = item.getQuantity() != null ? item.getQuantity() : 1;
                if (medicine.getStock() < qty) {
                    throw new RuntimeException(
                            "Insufficient stock for medicine: " + medicine.getName()
                                    + ". Available: " + medicine.getStock() + ", Required: " + qty);
                }
                medicine.setStock(medicine.getStock() - qty);
                medicineRepository.save(medicine);
            }

            prescription.setMedicines(prescriptionMedicines);
        }

        // Save prescription (cascades to PrescriptionMedicine via CascadeType.ALL)
        Prescription saved = prescriptionRepository.save(prescription);

        // Mark appointment completed AFTER prescription is saved successfully
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);

        // Generate bill after everything else succeeds
        billService.generateBill(appointmentId);

        return mapToResponseDto(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOWNLOAD PDF
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] downloadPrescriptionPdf(Long id) throws Exception {
        Prescription prescription = prescriptionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Prescription not found: " + id));
        return generatePrescriptionPdf(prescription);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENERATE PDF
    // FIX 4: Properly iterate List<PrescriptionMedicine> instead of toString()
    // FIX 5: 5-column table with all medicine fields
    // FIX 6: Null-safe medicines list check
    // ─────────────────────────────────────────────────────────────────────────
    public byte[] generatePrescriptionPdf(Prescription prescription) throws Exception {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 60, 60);
        PdfWriter.getInstance(document, out);
        document.open();

        // ── Fonts ──────────────────────────────────────────────────────────
        Font titleFont    = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  20);
        Font headerFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  14);
        Font normalFont   = FontFactory.getFont(FontFactory.HELVETICA,       11);
        Font smallFont    = FontFactory.getFont(FontFactory.HELVETICA,        9);
        Font boldFont     = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  11);
        Font tableHeader  = FontFactory.getFont(FontFactory.HELVETICA_BOLD,  10);

        // ── Hospital Header ────────────────────────────────────────────────
        Paragraph hospitalName = new Paragraph("City Care Hospital", titleFont);
        hospitalName.setAlignment(Element.ALIGN_CENTER);
        document.add(hospitalName);

        Paragraph hospitalAddress = new Paragraph("123 Health Street, Delhi | Ph: +91-11-XXXX-XXXX", normalFont);
        hospitalAddress.setAlignment(Element.ALIGN_CENTER);
        document.add(hospitalAddress);

        document.add(new Paragraph(" "));

        // Divider line
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell divCell = new PdfPCell();
        divCell.setBackgroundColor(new java.awt.Color(41, 128, 185));
        divCell.setFixedHeight(3f);
        divCell.setBorder(Rectangle.NO_BORDER);
        divider.addCell(divCell);
        document.add(divider);

        document.add(new Paragraph(" "));

        // ── Patient / Doctor Info ──────────────────────────────────────────
        Paragraph rxTitle = new Paragraph("PRESCRIPTION", headerFont);
        rxTitle.setAlignment(Element.ALIGN_LEFT);
        document.add(rxTitle);

        document.add(new Paragraph(" "));

        PdfPTable infoTable = new PdfPTable(new float[]{1, 1});
        infoTable.setWidthPercentage(100);

        addInfoCell(infoTable, "Patient Name",
                prescription.getAppointment().getPatient().getName(), boldFont, normalFont);
        addInfoCell(infoTable, "Doctor Name",
                prescription.getAppointment().getDoctor().getName(), boldFont, normalFont);
        String date = "N/A";

        if (prescription.getCreatedAt() != null) {
            date = prescription.getCreatedAt().toLocalDate().toString();
        }

        addInfoCell(infoTable, "Date", date, boldFont, normalFont);
        addInfoCell(infoTable, "Appointment ID",
                String.valueOf(prescription.getAppointment().getId()), boldFont, normalFont);

        document.add(infoTable);

        document.add(new Paragraph(" "));

        // ── Diagnosis ─────────────────────────────────────────────────────
        Paragraph diagLabel = new Paragraph("Diagnosis:", boldFont);
        document.add(diagLabel);
        Paragraph diagValue = new Paragraph(prescription.getDiagnosis(), normalFont);
        diagValue.setIndentationLeft(15f);
        document.add(diagValue);

        document.add(new Paragraph(" "));

        // ── Medicines Table ────────────────────────────────────────────────
        // FIX 4 + 5: Properly iterate List<PrescriptionMedicine> with all fields
        Paragraph medsLabel = new Paragraph("Prescribed Medicines:", boldFont);
        document.add(medsLabel);
        document.add(new Paragraph(" "));

        PdfPTable medTable = new PdfPTable(new float[]{2.5f, 1.5f, 1f, 0.8f, 2f});
        medTable.setWidthPercentage(100);

        // Table header row
        String[] headers = {"Medicine", "Frequency", "Duration", "Qty", "Instructions"};
        for (String h : headers) {
            PdfPCell cell = new PdfPCell(new Paragraph(h, tableHeader));
            cell.setBackgroundColor(new java.awt.Color(41, 128, 185));
            cell.setPadding(6f);
            // Use white font manually
            Font whiteFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10,
                    new java.awt.Color(255, 255, 255));
            cell.setPhrase(new Paragraph(h, whiteFont));
            medTable.addCell(cell);
        }

        // FIX 6: Null-safe check before iterating medicines
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
            PdfPCell emptyCell = new PdfPCell(new Paragraph("No medicines prescribed", smallFont));
            emptyCell.setColspan(5);
            emptyCell.setPadding(6f);
            medTable.addCell(emptyCell);
        }

        document.add(medTable);

        document.add(new Paragraph(" "));

        // ── Notes ─────────────────────────────────────────────────────────
        if (prescription.getNotes() != null && !prescription.getNotes().isBlank()) {
            document.add(new Paragraph("Notes:", boldFont));
            Paragraph notesVal = new Paragraph(prescription.getNotes(), normalFont);
            notesVal.setIndentationLeft(15f);
            document.add(notesVal);
            document.add(new Paragraph(" "));
        }

        document.add(new Paragraph(" "));
        document.add(new Paragraph(" "));

        // ── Signature ─────────────────────────────────────────────────────
        PdfPTable sigTable = new PdfPTable(new float[]{1, 1});
        sigTable.setWidthPercentage(100);

        PdfPCell leftSig = new PdfPCell();
        leftSig.setBorder(Rectangle.NO_BORDER);
        leftSig.addElement(new Paragraph("Patient Signature: ____________________", normalFont));
        sigTable.addCell(leftSig);

        PdfPCell rightSig = new PdfPCell();
        rightSig.setBorder(Rectangle.NO_BORDER);
        rightSig.setHorizontalAlignment(Element.ALIGN_RIGHT);
        rightSig.addElement(new Paragraph("Doctor Signature: ____________________", normalFont));
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
    // FIX 7: Map List<PrescriptionMedicine> → List<PrescriptionMedicineResponseDto>
    //         instead of passing raw entity into DTO builder
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<PrescriptionResponseDto> getPrescriptionsForLoggedInPatient(String username) {

        Patient patient = patientRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException("Patient not found: " + username));

        List<Prescription> prescriptions =
                prescriptionRepository.findByAppointment_Patient_Id(patient.getId());

        return prescriptions.stream()
                .map(this::mapToResponseDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * FIX 7: Central mapping method so both createPrescription and
     * getPrescriptionsForLoggedInPatient produce consistent DTOs.
     * Properly maps List<PrescriptionMedicine> → List<PrescriptionMedicineResponseDto>
     */
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
                .diagnosis(p.getDiagnosis())
                .notes(p.getNotes())
                .medicines(medicineDtos)  // ✅ List<PrescriptionMedicineResponseDto> not entity
                .appointmentId(p.getAppointment().getId())
                .createdAt(p.getCreatedAt())
                .build();
    }

    /** Helper: adds a label+value pair as a 2-cell row in info table */
    private void addInfoCell(PdfPTable table, String label, String value,
                             Font boldFont, Font normalFont) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(Rectangle.NO_BORDER);
        cell.setPaddingBottom(6f);
        cell.addElement(new Paragraph(label + ": ", boldFont));
        cell.addElement(new Paragraph(value != null ? value : "—", normalFont));
        table.addCell(cell);
    }

    /** Helper: adds a single data cell to the medicines table */
    private void addMedCell(PdfPTable table, String value,
                            Font font, java.awt.Color bgColor) {
        PdfPCell cell = new PdfPCell(new Paragraph(value != null ? value : "—", font));
        cell.setPadding(5f);
        cell.setBackgroundColor(bgColor);
        table.addCell(cell);
    }
}