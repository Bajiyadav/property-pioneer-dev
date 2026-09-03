package com.seedha.properties.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class Msg91SmsProviderTests {

    @Test
    void isConfiguredWhenAuthKeyPresent() {
        Msg91SmsProvider p = new Msg91SmsProvider("authkey123456", "template99", "SEEDHA");
        assertTrue(p.isConfigured());
        assertEquals("msg91", p.name());
    }

    @Test
    void throwsWhenAuthKeyMissing() {
        assertThrows(IllegalStateException.class, () -> new Msg91SmsProvider("", "template99", "SEEDHA"));
        assertThrows(IllegalStateException.class, () -> new Msg91SmsProvider("   ", "template99", "SEEDHA"));
        assertThrows(IllegalStateException.class, () -> new Msg91SmsProvider(null, "template99", "SEEDHA"));
    }

    @Test
    void normalisesIndianPhoneNumbersCorrectly() {
        assertEquals("919876543210", Msg91SmsProvider.normalizeIndianPhone("+919876543210"));
        assertEquals("919876543210", Msg91SmsProvider.normalizeIndianPhone("9876543210"));
        assertEquals("919876543210", Msg91SmsProvider.normalizeIndianPhone("09876543210"));
        assertEquals("919876543210", Msg91SmsProvider.normalizeIndianPhone("+91 98765 43210"));
        assertEquals("", Msg91SmsProvider.normalizeIndianPhone(null));
    }

    @Test
    void extractsOtpFromMessage() {
        String msg = "Your Seedha Properties verification code is 482910. It expires in 5 minutes.";
        assertEquals("482910", Msg91SmsProvider.extractOtp(msg));

        String shortMsg = "Code: 1234";
        assertEquals("1234", Msg91SmsProvider.extractOtp(shortMsg));

        String emptyMsg = "No numbers here";
        assertEquals("", Msg91SmsProvider.extractOtp(emptyMsg));
    }

    @Test
    void failsClosedOnNetworkErrorWithoutThrowing() {
        // Points to an unreachable local port to test offline error handling
        Msg91SmsProvider p = new Msg91SmsProvider("authkey_mock", "template_mock", "SEEDHA", "http://127.0.0.1:1");
        SmsProvider.Result result = p.send("+919876543210", "Your code is 654321");
        assertNotNull(result);
        assertFalse(result.delivered());
        assertEquals(SmsProvider.Status.DELIVERY_FAILED, result.status());
    }
}
