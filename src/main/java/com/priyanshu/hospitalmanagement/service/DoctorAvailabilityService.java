package com.priyanshu.hospitalmanagement.service;

import com.priyanshu.hospitalmanagement.dto.AvailableSlotDto;
import com.priyanshu.hospitalmanagement.entity.Appointment;
import com.priyanshu.hospitalmanagement.entity.DoctorAvailability;
import com.priyanshu.hospitalmanagement.repository.AppointmentRepository;
import com.priyanshu.hospitalmanagement.repository.DoctorAvailabilityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorAvailabilityService {

    private final DoctorAvailabilityRepository doctorAvailabilityRepository;
    private final AppointmentRepository appointmentRepository;

    private static final int SLOT_DURATION = 15;

    public List<AvailableSlotDto> getAvailableSlots(Long doctorId, LocalDate date) {

        DoctorAvailability availability =
                doctorAvailabilityRepository
                        .findByDoctorIdAndDate(doctorId, date)
                        .orElseThrow(() ->
                                new RuntimeException("Doctor not available on this date"));

        List<AvailableSlotDto> allSlots =
                generateSlots(availability.getStartTime(), availability.getEndTime());

        LocalDateTime start = date.atTime(availability.getStartTime());
        LocalDateTime end = date.atTime(availability.getEndTime());

        List<Appointment> bookedAppointments =
                appointmentRepository
                        .findByDoctorIdAndAppointmentTimeBetween(doctorId, start, end);

        List<LocalTime> bookedSlots = bookedAppointments
                .stream()
                .map(a -> a.getAppointmentTime().toLocalTime())
                .collect(Collectors.toList());

        // remove booked slots
        allSlots.removeIf(slot -> bookedSlots.contains(slot.getStartTime()));

        // remove past slots if date = today
        if (date.equals(LocalDate.now())) {
            LocalTime now = LocalTime.now();
            allSlots.removeIf(slot -> slot.getStartTime().isBefore(now));
        }

        return allSlots;
    }

    private List<AvailableSlotDto> generateSlots(LocalTime startTime, LocalTime endTime) {

        List<AvailableSlotDto> slots = new ArrayList<>();

        LocalTime current = startTime;

        while (current.plusMinutes(SLOT_DURATION).isBefore(endTime)
                || current.plusMinutes(SLOT_DURATION).equals(endTime)) {

            slots.add(new AvailableSlotDto(
                    current,
                    current.plusMinutes(SLOT_DURATION)
            ));

            current = current.plusMinutes(SLOT_DURATION);
        }

        return slots;
    }
}