package com.priyanshu.hospitalmanagement.service;

import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class OtpService {

    public String generateOtp() {
        int otp = 100000 + new Random().nextInt(900000);
        return String.valueOf(otp);
    }
}