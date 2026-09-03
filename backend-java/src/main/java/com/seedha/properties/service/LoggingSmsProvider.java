package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

/**
 * The safe default SMS provider for local and staging.
 *
 * It does NOT pretend an SMS was sent. When a phone OTP is routed here it records
 * that delivery was REQUESTED but returns {@code delivered=false} with status
 * SKIPPED_NO_PROVIDER, so nothing downstream can mistake staging for a working
 * SMS pipeline. The message body carries the OTP and is therefore never logged —
 * only the redacted destination and the honest status.
 *
 * A real provider (a Twilio/MSG91/SNS implementation of {@link SmsProvider})
 * annotated as a bean will replace this via {@code @ConditionalOnMissingBean},
 * so wiring a vendor is purely additive.
 */
@Service
@ConditionalOnMissingBean(name = "smsProvider")
public class LoggingSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(LoggingSmsProvider.class);

    @Override
    public Result send(String phone, String message) {
        // Never log `message` — it contains the OTP.
        log.info("SMS OTP delivery REQUESTED to {} but no SMS provider is configured; not delivered.",
                redact(phone));
        return Result.skipped();
    }

    @Override
    public boolean isConfigured() {
        return false;
    }

    @Override
    public String name() {
        return "logging-noop";
    }

    private String redact(String phone) {
        if (phone == null || phone.length() < 4) return "***";
        return phone.substring(0, 2) + "****" + phone.substring(phone.length() - 2);
    }
}
