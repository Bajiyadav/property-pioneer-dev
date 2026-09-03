package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class DefaultOtpDeliveryService implements OtpDeliveryService {

    private static final Logger logger = LoggerFactory.getLogger(DefaultOtpDeliveryService.class);

    @Override
    public void deliverOtp(String contact, String contactType, String purpose, String otp) {
        // Redact contact for privacy (never log the actual OTP secret)
        String redactedContact = redactContact(contact);
        logger.info("OTP delivery dispatched to {} ({}) for purpose [{}]", redactedContact, contactType, purpose);
    }

    private String redactContact(String contact) {
        if (contact == null || contact.isBlank()) return "UNKNOWN";
        if (contact.contains("@")) {
            String[] parts = contact.split("@", 2);
            String local = parts[0];
            String domain = parts.length > 1 ? parts[1] : "";
            if (local.length() <= 2) return local.charAt(0) + "***@" + domain;
            return local.substring(0, 2) + "***@" + domain;
        } else if (contact.length() > 4) {
            return contact.substring(0, 2) + "****" + contact.substring(contact.length() - 2);
        }
        return "***";
    }
}
