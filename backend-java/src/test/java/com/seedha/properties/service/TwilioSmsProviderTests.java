package com.seedha.properties.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Twilio provider config gating (Task: real SMS provider via env). No network
 * calls — construction and credential handling only.
 */
class TwilioSmsProviderTests {

    @Test
    void constructsWhenAllCredentialsArePresent() {
        TwilioSmsProvider p = new TwilioSmsProvider("ACxxxxxxxx", "tok_test", "+15005550006");
        assertTrue(p.isConfigured());
        assertEquals("twilio", p.name());
    }

    @Test
    void failsLoudlyWhenSelectedButCredentialsMissing() {
        // Selecting the provider without full credentials must not silently
        // fall back to "not delivering" — it stops startup.
        assertThrows(IllegalStateException.class, () -> new TwilioSmsProvider("", "tok", "+1"));
        assertThrows(IllegalStateException.class, () -> new TwilioSmsProvider("AC", "", "+1"));
        assertThrows(IllegalStateException.class, () -> new TwilioSmsProvider("AC", "tok", ""));
    }
}
