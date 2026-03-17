package com.priyanshu.hospitalmanagement.service;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import com.priyanshu.hospitalmanagement.dto.CreateMedicalRecordRequestDto;
import com.priyanshu.hospitalmanagement.dto.MedicalRecordResponseDto;
import com.priyanshu.hospitalmanagement.entity.*;
import com.priyanshu.hospitalmanagement.entity.type.AppointmentStatus;
import com.priyanshu.hospitalmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository medicalRecordRepository;
    private final AppointmentRepository appointmentRepository;
    private final PrescriptionRepository prescriptionRepository;
    private final PatientRepository patientRepository;
    private final BillRepository billRepository;
    private final BillService billService;
    private final EmailService emailService;

    private static final DateTimeFormatter DATE_FMT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

    // ─────────────────────────────────────────────────────────────────────────
    // CREATE MEDICAL RECORD
    // Doctor sets: diagnosis, notes, symptoms, treatmentPlan, testsRecommended
    // Links to existing prescription via prescriptionId (optional)
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional
    public MedicalRecordResponseDto createMedicalRecord(
            CreateMedicalRecordRequestDto requestDto) {

        Appointment appointment = appointmentRepository
                .findById(requestDto.getAppointmentId())
                .orElseThrow(() -> new RuntimeException(
                        "Appointment not found: " + requestDto.getAppointmentId()));

        // Guard: prevent duplicate medical record
        if (medicalRecordRepository.existsByAppointment_Id(
                requestDto.getAppointmentId())) {
            throw new RuntimeException(
                    "Medical record already exists for appointment: "
                            + requestDto.getAppointmentId());
        }

        // Build medical record — all clinical info lives here
        MedicalRecord record = new MedicalRecord();
        record.setAppointment(appointment);
        record.setPatient(appointment.getPatient());
        record.setDoctor(appointment.getDoctor());
        record.setDiagnosis(requestDto.getDiagnosis());
        record.setNotes(requestDto.getNotes());
        record.setSymptoms(requestDto.getSymptoms());
        record.setTreatmentPlan(requestDto.getTreatmentPlan());
        record.setTestsRecommended(requestDto.getTestsRecommended());
        record.setVisitDate(LocalDateTime.now());

        // Link prescription if provided
        if (requestDto.getPrescriptionId() != null) {
            prescriptionRepository.findById(requestDto.getPrescriptionId())
                    .ifPresent(record::setPrescription);
        }

        MedicalRecord saved = medicalRecordRepository.save(record);
        log.info("Medical record created for appointment: {}",
                requestDto.getAppointmentId());

        // ── Mark appointment COMPLETED ────────────────────────────────────
        appointment.setStatus(AppointmentStatus.COMPLETED);
        appointmentRepository.save(appointment);
        log.info("Appointment {} marked as COMPLETED",
                requestDto.getAppointmentId());

        // ── Auto-generate bill if not already exists ──────────────────────
        if (!billRepository.existsByAppointment_Id(requestDto.getAppointmentId())) {

            double consultationFee = appointment.getDoctor().getConsultationFee();
            double gstAmount       = Math.round(consultationFee * 0.18 * 100.0) / 100.0;
            double totalAmount     = Math.round((consultationFee + gstAmount) * 100.0) / 100.0;

            billService.generateBill(requestDto.getAppointmentId());
            log.info("Bill auto-generated for appointment: {}",
                    requestDto.getAppointmentId());

            // ── Send bill email to patient ────────────────────────────────
            emailService.sendBillGenerated(
                    appointment.getPatient().getUser().getUsername(),
                    appointment.getPatient().getName(),
                    consultationFee,
                    gstAmount,
                    totalAmount,
                    saved.getId()
            );
            log.info("Bill email sent to: {}",
                    appointment.getPatient().getUser().getUsername());
        }

        return mapToDto(saved);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET MEDICAL RECORDS FOR LOGGED-IN PATIENT
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MedicalRecordResponseDto> getMedicalRecordsForLoggedInPatient(
            String username) {

        Patient patient = patientRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException(
                        "Patient not found: " + username));

        return medicalRecordRepository.findByPatient_Id(patient.getId())
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GET MEDICAL RECORDS FOR DOCTOR
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public List<MedicalRecordResponseDto> getMedicalRecordsForDoctor(Long doctorId) {
        return medicalRecordRepository
                .findByDoctor_Id(doctorId)
                .stream()
                .map(this::mapToDto)
                .toList();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DOWNLOAD MEDICAL RECORD AS PDF
    // ─────────────────────────────────────────────────────────────────────────
    @Transactional(readOnly = true)
    public byte[] downloadMedicalRecordPdf(Long recordId,
                                           String username) throws Exception {

        Patient patient = patientRepository
                .findByUser_Username(username)
                .orElseThrow(() -> new RuntimeException(
                        "Patient not found: " + username));

        MedicalRecord record = medicalRecordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException(
                        "Medical record not found: " + recordId));

        // Security: patient can only download their own records
        if (!record.getPatient().getId().equals(patient.getId())) {
            throw new RuntimeException(
                    "Access denied: this record does not belong to you.");
        }

        return generateMedicalRecordPdf(record);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // GENERATE PDF
    // ─────────────────────────────────────────────────────────────────────────
    private byte[] generateMedicalRecordPdf(MedicalRecord record) throws Exception {

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 60, 60);
        PdfWriter.getInstance(document, out);
        document.open();

        Font titleFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
        Font headFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13);
        Font boldFont   = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font normalFont = FontFactory.getFont(FontFactory.HELVETICA,      11);
        Font smallFont  = FontFactory.getFont(FontFactory.HELVETICA,       9);
        Font whiteFont  = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10,
                new java.awt.Color(255, 255, 255));

        java.awt.Color accent = new java.awt.Color(39, 174, 96);
        java.awt.Color altRow = new java.awt.Color(235, 250, 240);

        // ── Hospital Header ────────────────────────────────────────────────
        Paragraph hospitalName = new Paragraph("City Care Hospital", titleFont);
        hospitalName.setAlignment(Element.ALIGN_CENTER);
        document.add(hospitalName);

        Paragraph hospitalAddress = new Paragraph(
                "123 Health Street, Delhi | Ph: +91-11-XXXX-XXXX", normalFont);
        hospitalAddress.setAlignment(Element.ALIGN_CENTER);
        document.add(hospitalAddress);

        document.add(new Paragraph(" "));
        addDivider(document, accent);
        document.add(new Paragraph(" "));

        // ── Title ──────────────────────────────────────────────────────────
        Paragraph title = new Paragraph("MEDICAL RECORD", headFont);
        title.setAlignment(Element.ALIGN_LEFT);
        document.add(title);

        Paragraph recordNum = new Paragraph(
                "Record ID: MR-" + String.format("%05d", record.getId()),
                normalFont);
        document.add(recordNum);
        document.add(new Paragraph(" "));

        // ── Patient / Doctor Info ──────────────────────────────────────────
        String departmentName = record.getDoctor().getDepartments().stream()
                .findFirst()
                .map(Department::getName)
                .orElse("—");

        String specialization = record.getDoctor().getSpecialization() != null
                ? record.getDoctor().getSpecialization() : "—";

        PdfPTable infoTable = new PdfPTable(new float[]{1, 1});
        infoTable.setWidthPercentage(100);

        addInfoCell(infoTable, "Patient Name",
                record.getPatient().getName(), boldFont, normalFont);
        addInfoCell(infoTable, "Visit Date",
                record.getVisitDate() != null
                        ? record.getVisitDate().format(DATE_FMT) : "—",
                boldFont, normalFont);
        addInfoCell(infoTable, "Doctor Name",
                record.getDoctor().getName(), boldFont, normalFont);
        addInfoCell(infoTable, "Appointment ID",
                String.valueOf(record.getAppointment().getId()),
                boldFont, normalFont);
        addInfoCell(infoTable, "Department",
                departmentName, boldFont, normalFont);
        addInfoCell(infoTable, "Specialization",
                specialization, boldFont, normalFont);

        document.add(infoTable);
        document.add(new Paragraph(" "));

        // ── Symptoms ──────────────────────────────────────────────────────
        if (record.getSymptoms() != null && !record.getSymptoms().isBlank()) {
            document.add(sectionHeader("Symptoms", accent));
            document.add(new Paragraph(" "));
            Paragraph symptomsPara = new Paragraph(record.getSymptoms(), normalFont);
            symptomsPara.setIndentationLeft(15f);
            document.add(symptomsPara);
            document.add(new Paragraph(" "));
        }

        // ── Diagnosis ─────────────────────────────────────────────────────
        document.add(sectionHeader("Diagnosis", accent));
        document.add(new Paragraph(" "));
        Paragraph diagPara = new Paragraph(
                record.getDiagnosis() != null ? record.getDiagnosis() : "—",
                normalFont);
        diagPara.setIndentationLeft(15f);
        document.add(diagPara);
        document.add(new Paragraph(" "));

        // ── Treatment Plan ────────────────────────────────────────────────
        if (record.getTreatmentPlan() != null && !record.getTreatmentPlan().isBlank()) {
            document.add(sectionHeader("Treatment Plan", accent));
            document.add(new Paragraph(" "));
            Paragraph treatPara = new Paragraph(record.getTreatmentPlan(), normalFont);
            treatPara.setIndentationLeft(15f);
            document.add(treatPara);
            document.add(new Paragraph(" "));
        }

        // ── Tests Recommended ─────────────────────────────────────────────
        if (record.getTestsRecommended() != null
                && !record.getTestsRecommended().isBlank()) {
            document.add(sectionHeader("Tests Recommended", accent));
            document.add(new Paragraph(" "));
            Paragraph testsPara = new Paragraph(
                    record.getTestsRecommended(), normalFont);
            testsPara.setIndentationLeft(15f);
            document.add(testsPara);
            document.add(new Paragraph(" "));
        }

        // ── Clinical Notes ────────────────────────────────────────────────
        document.add(sectionHeader("Clinical Notes", accent));
        document.add(new Paragraph(" "));
        Paragraph notesPara = new Paragraph(
                record.getNotes() != null ? record.getNotes() : "—",
                normalFont);
        notesPara.setIndentationLeft(15f);
        document.add(notesPara);
        document.add(new Paragraph(" "));

        // ── Prescribed Medicines (from linked prescription) ────────────────
        if (record.getPrescription() != null) {
            Prescription rx = record.getPrescription();

            document.add(sectionHeader("Prescribed Medicines", accent));
            document.add(new Paragraph(" "));

            PdfPTable medTable = new PdfPTable(
                    new float[]{2.5f, 1.5f, 1f, 0.8f, 2f});
            medTable.setWidthPercentage(100);

            for (String h : new String[]{
                    "Medicine", "Frequency", "Duration", "Qty", "Instructions"}) {
                PdfPCell hCell = new PdfPCell(new Paragraph(h, whiteFont));
                hCell.setBackgroundColor(accent);
                hCell.setPadding(6f);
                medTable.addCell(hCell);
            }

            List<PrescriptionMedicine> meds = rx.getMedicines();
            if (meds != null && !meds.isEmpty()) {
                boolean alt = false;
                for (PrescriptionMedicine pm : meds) {
                    java.awt.Color rowColor = alt ? altRow : java.awt.Color.WHITE;
                    alt = !alt;
                    addMedCell(medTable, pm.getMedicine().getName(),
                            normalFont, rowColor);
                    addMedCell(medTable, pm.getFrequency(),
                            normalFont, rowColor);
                    addMedCell(medTable, pm.getDurationDays() + " days",
                            normalFont, rowColor);
                    addMedCell(medTable, String.valueOf(pm.getQuantity()),
                            normalFont, rowColor);
                    addMedCell(medTable,
                            pm.getInstructions() != null
                                    ? pm.getInstructions() : "—",
                            normalFont, rowColor);
                }
            } else {
                PdfPCell empty = new PdfPCell(
                        new Paragraph("No medicines listed", smallFont));
                empty.setColspan(5);
                empty.setPadding(6f);
                medTable.addCell(empty);
            }

            document.add(medTable);
            document.add(new Paragraph(" "));
        }

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
        rightSig.addElement(new Paragraph(
                "Doctor Signature: ____________________", normalFont));
        rightSig.setHorizontalAlignment(Element.ALIGN_RIGHT);
        sigTable.addCell(rightSig);

        document.add(sigTable);
        document.add(new Paragraph(" "));

        // Footer
        Paragraph footer = new Paragraph(
                "Confidential Medical Record — City Care Hospital. Issued on "
                        + LocalDateTime.now().format(DATE_FMT),
                smallFont);
        footer.setAlignment(Element.ALIGN_CENTER);
        document.add(footer);

        document.close();
        return out.toByteArray();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────────────────────────────────
    private MedicalRecordResponseDto mapToDto(MedicalRecord r) {
        return MedicalRecordResponseDto.builder()
                .id(r.getId())
                .diagnosis(r.getDiagnosis())
                .notes(r.getNotes())
                .patientId(r.getPatient().getId())
                .patientName(r.getPatient().getName())
                .doctorId(r.getDoctor().getId())
                .doctorName(r.getDoctor().getName())
                .appointmentId(r.getAppointment().getId())
                .prescriptionId(r.getPrescription() != null
                        ? r.getPrescription().getId() : null)
                .visitDate(r.getVisitDate())
                .build();
    }

    private Paragraph sectionHeader(String text, java.awt.Color color) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12);
        f.setColor(color);
        return new Paragraph(text, f);
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

    private void addMedCell(PdfPTable table, String value,
                            Font font, java.awt.Color bg) {
        PdfPCell cell = new PdfPCell(
                new Paragraph(value != null ? value : "—", font));
        cell.setPadding(5f);
        cell.setBackgroundColor(bg);
        table.addCell(cell);
    }

    private void addDivider(Document doc, java.awt.Color color)
            throws DocumentException {
        PdfPTable divider = new PdfPTable(1);
        divider.setWidthPercentage(100);
        PdfPCell cell = new PdfPCell();
        cell.setBackgroundColor(color);
        cell.setFixedHeight(3f);
        cell.setBorder(Rectangle.NO_BORDER);
        divider.addCell(cell);
        doc.add(divider);
    }
}