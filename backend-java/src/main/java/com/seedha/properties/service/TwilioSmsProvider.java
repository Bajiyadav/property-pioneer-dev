package com.seedha.properties.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;

/**
 * Twilio SMS provider — one concrete implementation of {@link SmsProvider}.
 *
 * It is wired ONLY when {@code seedha.sms.provider=twilio} and the credentials
 * are present, so a deployment without them keeps the safe no-op provider and
 * nothing here ever runs. The account SID, auth token and from-number come from
 * the environment / secret manager; none is hardcoded, logged, or returned.
 *
 * As the {@code @Primary} {@link SmsProvider} when active, it replaces the no-op
 * for OtpDeliveryService with no other change. Vendor swap = a sibling class.
 */
@Service("smsProvider")
@Primary
@ConditionalOnProperty(name = "seedha.sms.provider", havingValue = "twilio")
public class TwilioSmsProvider implements SmsProvider {

    private static final Logger log = LoggerFactory.getLogger(TwilioSmsProvider.class);

    private final String accountSid;
    private final String authToken;
    private final String fromNumber;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public TwilioSmsProvider(
            @Value("${TWILIO_ACCOUNT_SID:}") String accountSid,
            @Value("${TWILIO_AUTH_TOKEN:}") String authToken,
            @Value("${TWILIO_FROM_NUMBER:}") String fromNumber) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.fromNumber = fromNumber;
        if (!isConfigured()) {
            // Selected as the provider but missing credentials — fail loudly at
            // startup rather than silently not delivering OTPs in production.
            throw new IllegalStateException(
                    "seedha.sms.provider=twilio but TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / "
                            + "TWILIO_FROM_NUMBER are not all configured. Supply them via the "
                            + "environment / secret manager, or unset seedha.sms.provider.");
        }
        log.info("Twilio SMS provider active (from number configured, credentials from environment).");
    }

    @Override
    public boolean isConfigured() {
        return notBlank(accountSid) && notBlank(authToken) && notBlank(fromNumber);
    }

    @Override
    public String name() {
        return "twilio";
    }

    @Override
    public Result send(String phone, String message) {
        try {
            String body = "To=" + enc(phone) + "&From=" + enc(fromNumber) + "&Body=" + enc(message);
            String basic = Base64.getEncoder().encodeToString(
                    (accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Basic " + basic)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .POST(HttpRequest.BodyPublishers.ofString(body))
                    .build();

            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            int code = response.statusCode();
            if (code >= 200 && code < 300) {
                // The response body echoes the message text, so it is not logged.
                return Result.requested(extractSid(response.body()));
            }
            // Twilio error bodies can contain the recipient number; log only the code.
            log.warn("Twilio SMS send failed with HTTP {}", code);
            return Result.failed("twilio http " + code);
        } catch (Exception ex) {
            // The exception message can contain the URL/number; log the class only.
            log.warn("Twilio SMS send errored: {}", ex.getClass().getSimpleName());
            return Result.failed(ex.getClass().getSimpleName());
        }
    }

    private static String extractSid(String json) {
        if (json == null) return null;
        int i = json.indexOf("\"sid\"");
        if (i < 0) return null;
        int c = json.indexOf(':', i);
        int q1 = json.indexOf('"', c + 1);
        int q2 = json.indexOf('"', q1 + 1);
        return (q1 >= 0 && q2 > q1) ? json.substring(q1 + 1, q2) : null;
    }

    private static String enc(String v) {
        return URLEncoder.encode(v == null ? "" : v, StandardCharsets.UTF_8);
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
