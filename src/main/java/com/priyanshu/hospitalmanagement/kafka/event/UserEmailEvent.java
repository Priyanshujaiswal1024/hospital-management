package com.priyanshu.hospitalmanagement.kafka.event;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEmailEvent {

    public enum Kind {
        OTP, PATIENT_WELCOME, DOCTOR_WELCOME
    }

    private Kind kind;
    private String toEmail;
    private String name;
    private String otp;
    private String tempPassword;
}