package com.seedha.properties.service;

public interface OtpDeliveryService {
    void deliverOtp(String contact, String contactType, String purpose, String otp);
}
