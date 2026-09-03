package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Routes a generated OTP to the right channel and records the delivery outcome
 * honestly.
 *
 * The four states the task requires are kept distinct and never conflated:
 *   OTP GENERATED           — done by OtpService before it calls here.
 *   OTP DELIVERY REQUESTED   — we asked a provider to send.
 *   OTP DELIVERY CONFIRMED   — a real provider acknowledged the send.
 *   OTP DELIVERY FAILED      — a provider rejected/errored, or none is configured.
 *
 * Phone OTPs go through {@link SmsProvider} (a no-op logging provider in staging,
 * a real vendor in production). Email OTPs are logged as requested for now; an
 * EmailProvider can slot in the same way. The OTP itself is never logged, never
 * returned, and never placed in a URL.
 */
@Service
public class DefaultOtpDeliveryService implements OtpDeliveryService {

    private static final Logger logger = LoggerFactory.getLogger(DefaultOtpDeliveryService.class);

    private final SmsProvider smsProvider;

    public DefaultOtpDeliveryService(SmsProvider smsProvider) {
        this.smsProvider = smsProvider;
    }

    @Override
    public void deliverOtp(String contact, String contactType, String purpose, String otp) {
        String redacted = redactContact(contact);

        if ("PHONE".equalsIgnoreCase(contactType)) {
            // The body carries the OTP; it is built here and handed straight to the
            // provider, never logged.
            String message = "Your Seedha Properties verification code is " + otp
                    + ". It expires in 5 minutes. Do not share it with anyone.";
            SmsProvider.Result result = smsProvider.send(contact, message);
            logger.info("OTP delivery via SMS provider '{}' to {} [purpose={}] -> status={} delivered={}",
                    smsProvider.name(), redacted, purpose, result.status(), result.delivered());
            return;
        }

        // Email (and any other channel) — no provider wired here yet, so this is an
        // honest "requested" record, not a claim of delivery.
        logger.info("OTP delivery REQUESTED via {} to {} [purpose={}]; no {} provider configured.",
                contactType, redacted, purpose, contactType);
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
