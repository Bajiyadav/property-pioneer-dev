package com.seedha.properties.service;

/**
 * Channel abstraction for sending an SMS.
 *
 * OtpService never talks to a vendor directly — it goes through OtpDeliveryService,
 * which routes phone OTPs here. Swapping vendors (Twilio, MSG91, AWS SNS, a
 * self-hosted gateway) is a new implementation of this interface selected by
 * configuration; nothing else in the app changes.
 *
 * The result is deliberately honest about outcome. A deployment with no real
 * provider returns REQUESTED/SKIPPED with {@code delivered=false} — it never
 * reports CONFIRMED for a message that was not actually handed to a carrier.
 */
public interface SmsProvider {

    enum Status {
        /** The provider accepted the request and handed it to the carrier. */
        DELIVERY_REQUESTED,
        /** The carrier/provider confirmed acceptance (as far as this API can tell). */
        DELIVERY_CONFIRMED,
        /** The provider rejected or errored. */
        DELIVERY_FAILED,
        /** No real provider is configured; nothing was sent. NOT a success. */
        SKIPPED_NO_PROVIDER
    }

    /**
     * @param phone   destination in E.164-ish form; the provider validates/normalises further.
     * @param message the full message body. Contains the OTP, so it is never logged.
     * @return the outcome; {@link Result#delivered()} is false unless a real send happened.
     */
    Result send(String phone, String message);

    /** True when this is a real, configured provider (not the safe no-op default). */
    boolean isConfigured();

    /** Short name for audit/log lines (never includes credentials). */
    String name();

    record Result(Status status, boolean delivered, String providerMessageId, String detail) {
        public static Result requested(String id) {
            return new Result(Status.DELIVERY_REQUESTED, true, id, null);
        }
        public static Result confirmed(String id) {
            return new Result(Status.DELIVERY_CONFIRMED, true, id, null);
        }
        public static Result failed(String detail) {
            return new Result(Status.DELIVERY_FAILED, false, null, detail);
        }
        public static Result skipped() {
            return new Result(Status.SKIPPED_NO_PROVIDER, false, null, "no SMS provider configured");
        }
    }
}
