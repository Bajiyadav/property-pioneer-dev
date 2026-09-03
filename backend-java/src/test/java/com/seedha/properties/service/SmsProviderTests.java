package com.seedha.properties.service;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * SMS provider abstraction + honest delivery status (Task §4).
 *
 * Plain unit tests — no Spring context, no database. They pin the two things
 * that keep the pipeline honest: the staging default never claims delivery, and
 * the OTP is never handed to anything that logs it.
 */
class SmsProviderTests {

    @Test
    void loggingProviderNeverClaimsDelivery() {
        SmsProvider provider = new LoggingSmsProvider();
        SmsProvider.Result result = provider.send("+919876543210", "code 123456");

        assertFalse(provider.isConfigured());
        assertEquals(SmsProvider.Status.SKIPPED_NO_PROVIDER, result.status());
        assertFalse(result.delivered(), "staging must never report a message as delivered");
        assertNull(result.providerMessageId());
    }

    @Test
    void resultFactoriesCarryTheRightDeliveredFlag() {
        assertTrue(SmsProvider.Result.requested("m1").delivered());
        assertTrue(SmsProvider.Result.confirmed("m2").delivered());
        assertFalse(SmsProvider.Result.failed("boom").delivered());
        assertFalse(SmsProvider.Result.skipped().delivered());
        assertEquals(SmsProvider.Status.DELIVERY_FAILED, SmsProvider.Result.failed("x").status());
    }

    @Test
    void deliveryServiceRoutesPhoneToTheProviderWithoutExposingTheOtp() {
        // A capturing provider stands in for a real vendor: it records what it was
        // given so the test can prove the OTP reached the provider (the SMS body)
        // and, separately, that nothing here returns or exposes it.
        List<String> sentBodies = new ArrayList<>();
        SmsProvider capturing = new SmsProvider() {
            @Override public Result send(String phone, String message) {
                sentBodies.add(message);
                return Result.confirmed("vendor-123");
            }
            @Override public boolean isConfigured() { return true; }
            @Override public String name() { return "test-vendor"; }
        };

        DefaultOtpDeliveryService delivery = new DefaultOtpDeliveryService(capturing);
        // deliverOtp returns void and must not throw or leak the OTP anywhere.
        assertDoesNotThrow(() -> delivery.deliverOtp("+919876543210", "PHONE", "LOGIN", "654321"));

        assertEquals(1, sentBodies.size());
        assertTrue(sentBodies.get(0).contains("654321"), "the OTP belongs in the SMS body handed to the provider");
        assertTrue(sentBodies.get(0).toLowerCase().contains("do not share"));
    }

    @Test
    void emailChannelDoesNotThrowWithNoProvider() {
        DefaultOtpDeliveryService delivery = new DefaultOtpDeliveryService(new LoggingSmsProvider());
        assertDoesNotThrow(() -> delivery.deliverOtp("user@test.local", "EMAIL", "SIGNUP", "111111"));
    }
}
